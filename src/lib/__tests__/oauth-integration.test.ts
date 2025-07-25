import { findOrCreateOAuthUser } from '../auth-utils';
import { prisma } from '../prisma';

// Mock the Prisma client
jest.mock('../prisma', () => ({
    prisma: {
        account: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('OAuth Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findOrCreateOAuthUser', () => {
        it('should return existing user when account exists', async () => {
            // Mock existing account
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                passwordHash: 'hashed-password',
                bio: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockAccount = {
                id: 'account-123',
                userId: 'user-123',
                type: 'oauth',
                provider: 'google',
                providerAccountId: 'google-123',
                user: mockUser,
            };

            (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

            const result = await findOrCreateOAuthUser(
                'google',
                'google-123',
                {
                    email: 'test@example.com',
                    name: 'Test User',
                }
            );

            expect(prisma.account.findUnique).toHaveBeenCalledWith({
                where: {
                    provider_providerAccountId: {
                        provider: 'google',
                        providerAccountId: 'google-123',
                    },
                },
                include: {
                    user: true,
                },
            });

            // Should return user without password hash
            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                bio: null,
                profileImageUrl: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
        });

        it('should link new OAuth account to existing user with same email', async () => {
            // Mock no existing account but existing user with same email
            (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                passwordHash: 'hashed-password',
                bio: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.account.create as jest.Mock).mockResolvedValue({
                id: 'new-account-123',
                userId: 'user-123',
                type: 'oauth',
                provider: 'google',
                providerAccountId: 'google-123',
            });

            const result = await findOrCreateOAuthUser(
                'google',
                'google-123',
                {
                    email: 'test@example.com',
                    name: 'Test User',
                }
            );

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });

            expect(prisma.account.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: 'google-123',
                },
            });

            // Should return user without password hash
            expect(result).toEqual({
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                bio: null,
                profileImageUrl: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
        });

        it('should create new user when no account or user exists', async () => {
            // Mock no existing account and no existing user
            (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // For email check
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // For username check

            const mockNewUser = {
                id: 'new-user-123',
                email: 'newuser@example.com',
                username: 'newuser',
                displayName: 'New User',
                passwordHash: null,
                bio: null,
                profileImageUrl: 'https://example.com/profile.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
                accounts: [
                    {
                        id: 'new-account-123',
                        userId: 'new-user-123',
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: 'google-456',
                    },
                ],
            };

            (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

            const result = await findOrCreateOAuthUser(
                'google',
                'google-456',
                {
                    email: 'newuser@example.com',
                    name: 'New User',
                    image: 'https://example.com/profile.jpg',
                }
            );

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: 'newuser@example.com',
                    username: 'newuser',
                    displayName: 'New User',
                    profileImageUrl: 'https://example.com/profile.jpg',
                    accounts: {
                        create: {
                            type: 'oauth',
                            provider: 'google',
                            providerAccountId: 'google-456',
                        },
                    },
                },
                include: {
                    accounts: true,
                },
            });

            // Should return user without password hash
            expect(result).toEqual({
                id: 'new-user-123',
                email: 'newuser@example.com',
                username: 'newuser',
                displayName: 'New User',
                bio: null,
                profileImageUrl: 'https://example.com/profile.jpg',
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                accounts: [
                    {
                        id: 'new-account-123',
                        userId: 'new-user-123',
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: 'google-456',
                    },
                ],
            });
        });

        it('should generate unique username when username already exists', async () => {
            // Mock no existing account and no existing user but username conflict
            (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // For email check
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing-user' }); // First username check (conflict)
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null); // Second username check (no conflict)

            const mockNewUser = {
                id: 'new-user-123',
                email: 'john@example.com',
                username: 'johndoe1',
                displayName: 'John Doe',
                passwordHash: null,
                bio: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                accounts: [
                    {
                        id: 'new-account-123',
                        userId: 'new-user-123',
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: 'google-789',
                    },
                ],
            };

            (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

            const result = await findOrCreateOAuthUser(
                'google',
                'google-789',
                {
                    email: 'john@example.com',
                    name: 'John Doe',
                }
            );

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    email: 'john@example.com',
                    username: 'johndoe1', // Should have incremented number
                    displayName: 'John Doe',
                    profileImageUrl: undefined,
                    accounts: {
                        create: {
                            type: 'oauth',
                            provider: 'google',
                            providerAccountId: 'google-789',
                        },
                    },
                },
                include: {
                    accounts: true,
                },
            });

            // Should return user without password hash
            expect(result).toEqual({
                id: 'new-user-123',
                email: 'john@example.com',
                username: 'johndoe1',
                displayName: 'John Doe',
                bio: null,
                profileImageUrl: null,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
                accounts: [
                    {
                        id: 'new-account-123',
                        userId: 'new-user-123',
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: 'google-789',
                    },
                ],
            });
        });
    });
});