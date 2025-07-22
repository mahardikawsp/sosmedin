import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { comparePassword } from "./auth-utils";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
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
                    username: (user as any).username,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string;
                session.user.username = token.username as string;
            }
            return session;
        },
        async signIn({ user, account, profile }) {
            // For OAuth sign-ins, we need to check if a username exists
            // If not, we need to create one based on the email or name
            if (account?.provider === "google" && user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                // If user exists but doesn't have an account for this provider, link them
                if (existingUser) {
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
    secret: process.env.NEXTAUTH_SECRET || "default-secret-change-in-production",
};