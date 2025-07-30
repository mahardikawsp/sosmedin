import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { comparePassword } from "./auth-utils";
import { CustomPrismaAdapter } from "./custom-prisma-adapter";



export const authOptions: NextAuthOptions = {
    adapter: CustomPrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isPasswordValid = await comparePassword(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName || user.username,
                    username: user.username,
                    image: user.profileImageUrl,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (account && user) {
                return {
                    ...token,
                    userId: user.id,
                    username: (user as any).username || '',
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string;
                (session.user as any).username = token.username as string;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Force use of production domain
            const correctBaseUrl = 'https://avvhvzvndubd.ap-southeast-1.clawcloudrun.com';

            console.log('NextAuth redirect:', { url, baseUrl, correctBaseUrl });

            // Fix any localhost URLs in the incoming URL
            let fixedUrl = url;
            if (url.includes('localhost:3000')) {
                fixedUrl = url.replace(/https?:\/\/localhost:3000/g, correctBaseUrl);
                console.log('Fixed localhost URL:', url, '->', fixedUrl);
            }

            // If url is relative, make it absolute with correct domain
            if (fixedUrl.startsWith('/')) {
                const redirectUrl = `${correctBaseUrl}${fixedUrl}`;
                console.log('Redirecting to:', redirectUrl);
                return redirectUrl;
            }

            // If url is absolute and matches our domain, allow it
            if (fixedUrl.startsWith(correctBaseUrl)) {
                console.log('Allowing redirect to:', fixedUrl);
                return fixedUrl;
            }

            // For external URLs or localhost, redirect to dashboard
            const dashboardUrl = `${correctBaseUrl}/dashboard`;
            console.log('External/localhost URL, redirecting to dashboard:', dashboardUrl);
            return dashboardUrl;
        },
        async signIn({ user, account, profile }) {
            // Allow OAuth providers to link with existing accounts
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    include: { accounts: true }
                });

                // If user exists, check if they already have an account with this provider
                if (existingUser) {
                    const existingAccount = existingUser.accounts.find(
                        (acc) => acc.provider === account.provider
                    );

                    // If they don't have an account with this provider, link it
                    if (!existingAccount) {
                        await prisma.account.create({
                            data: {
                                userId: existingUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                refresh_token: account.refresh_token,
                                access_token: account.access_token,
                                expires_at: account.expires_at,
                                token_type: account.token_type,
                                scope: account.scope,
                                id_token: account.id_token,
                                session_state: account.session_state,
                            },
                        });
                    }

                    // Return true to allow sign in with the existing user
                    return true;
                }

                // If user doesn't exist, create a new user with a generated username
                if (!existingUser) {
                    // Generate a username from the email or name
                    let baseUsername = user.name
                        ? user.name.replace(/\s+/g, "").toLowerCase()
                        : user.email.split("@")[0].toLowerCase();

                    let username = baseUsername;
                    let counter = 1;

                    // Check if username exists and generate a unique one
                    while (true) {
                        const existingUsername = await prisma.user.findUnique({
                            where: { username },
                        });

                        if (!existingUsername) break;

                        username = `${baseUsername}${counter}`;
                        counter++;
                    }

                    // Create the user
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            username,
                            displayName: user.name || username,
                            profileImageUrl: user.image || undefined,
                        },
                    });
                }
            }

            return true;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
    // Allow linking accounts with the same email address
    // allowDangerousEmailAccountLinking: true, // This option may not be available in this version
};