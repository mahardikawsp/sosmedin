import type { PrismaClient } from '../generated/prisma';
import type { Adapter } from 'next-auth/adapters';

/**
 * Custom Prisma adapter for NextAuth.js
 * This adapter extends the functionality of the default Prisma adapter
 * to work with our custom User model that includes username field
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
    return {
        createUser: async (data: any) => {
            // Generate a username from the email
            const baseUsername = data.email.split('@')[0].toLowerCase();
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

            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    emailVerified: data.emailVerified,
                    username,
                    displayName: data.name || username,
                    profileImageUrl: data.image,
                },
            });

            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.displayName || undefined,
                image: user.profileImageUrl || undefined,
                username: user.username,
            };
        },

        getUser: async (id) => {
            const user = await prisma.user.findUnique({
                where: { id },
            });

            if (!user) return null;

            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.displayName || undefined,
                image: user.profileImageUrl || undefined,
                username: user.username,
            };
        },

        getUserByEmail: async (email) => {
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) return null;

            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.displayName || undefined,
                image: user.profileImageUrl || undefined,
                username: user.username,
            };
        },

        getUserByAccount: async ({ provider, providerAccountId }) => {
            const account = await prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider,
                        providerAccountId,
                    },
                },
                include: { user: true },
            });

            if (!account) return null;

            const { user } = account;

            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.displayName || undefined,
                image: user.profileImageUrl || undefined,
                username: user.username,
            };
        },

        updateUser: async (data) => {
            const { id, ...userData } = data;

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: userData.email,
                    emailVerified: userData.emailVerified,
                    displayName: userData.name,
                    profileImageUrl: userData.image,
                },
            });

            return {
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.displayName || undefined,
                image: user.profileImageUrl || undefined,
                username: user.username,
            };
        },

        deleteUser: async (userId) => {
            await prisma.user.delete({
                where: { id: userId },
            });
        },

        linkAccount: async (data: any) => {
            await prisma.account.create({
                data: {
                    userId: data.userId,
                    type: data.type,
                    provider: data.provider,
                    providerAccountId: data.providerAccountId,
                    refresh_token: data.refresh_token,
                    access_token: data.access_token,
                    expires_at: data.expires_at,
                    token_type: data.token_type,
                    scope: data.scope,
                    id_token: data.id_token,
                    session_state: data.session_state,
                },
            });
        },

        unlinkAccount: async ({ provider, providerAccountId }) => {
            await prisma.account.delete({
                where: {
                    provider_providerAccountId: {
                        provider,
                        providerAccountId,
                    },
                },
            });
        },

        createSession: async (data) => {
            const session = await prisma.session.create({
                data,
            });

            return session;
        },

        getSessionAndUser: async (sessionToken) => {
            const session = await prisma.session.findUnique({
                where: { sessionToken },
                include: { user: true },
            });

            if (!session) return null;

            const { user } = session;

            return {
                session,
                user: {
                    id: user.id,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    name: user.displayName || undefined,
                    image: user.profileImageUrl || undefined,
                    username: user.username,
                },
            };
        },

        updateSession: async (data) => {
            const session = await prisma.session.update({
                where: { sessionToken: data.sessionToken },
                data,
            });

            return session;
        },

        deleteSession: async (sessionToken) => {
            await prisma.session.delete({
                where: { sessionToken },
            });
        },

        createVerificationToken: async (data) => {
            const verificationToken = await prisma.verificationToken.create({
                data,
            });

            return verificationToken;
        },

        useVerificationToken: async (params) => {
            try {
                const verificationToken = await prisma.verificationToken.delete({
                    where: {
                        identifier_token: {
                            identifier: params.identifier,
                            token: params.token,
                        },
                    },
                });

                return verificationToken;
            } catch (error) {
                // If token not found, return null
                return null;
            }
        },
    };
}