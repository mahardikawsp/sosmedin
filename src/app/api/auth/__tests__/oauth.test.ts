import { findOrCreateOAuthUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
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

describe('OAuth Authentication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

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

        (prisma.account.findUnique as jest.Mock).mockResolvedValue({
            id: 'account-123',
            userId: 'user-123',
            type: 'oauth',
            provider: 'google',
            providerAccountId: '12345',
            user: mockUser,
        });

        // Call the function
        const result = await findOrCreateOAuthUser(
            'google',
            '12345',
            {
                email: 'test@example.com',
                name: 'Test User',
            }
        );

        // Verify result
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

        // Verify prisma calls
        expect(prisma.account.findUnique).toHaveBeenCalledWith({
            where: {
                provider_providerAccountId: {
                    provider: 'google',
                    providerAccountId: '12345',
                },
            },
            include: {
                user: true,
            },
        });
    });

    it('should link account to existing user with same email', async () => {
        // Mock no existing account but existing user
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
            id: 'account-123',
            userId: 'user-123',
            type: 'oauth',
            provider: 'google',
            providerAccountId: '12345',
        });

        // Call the function
        const result = await findOrCreateOAuthUser(
            'google',
            '12345',
            {
                email: 'test@example.com',
                name: 'Test User',
            }
        );

        // Verify result
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

        // Verify prisma calls
        expect(prisma.account.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-123',
                type: 'oauth',
                provider: 'google',
                providerAccountId: '12345',
            },
        });
    });

    it('should create new user and account when no existing user', async () => {
        // Mock no existing account and no existing user
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // No existing user with email
            .mockResolvedValueOnce(null); // No existing username

        const mockNewUser = {
            id: 'user-new',
            email: 'new@example.com',
            username: 'newuser',
            displayName: 'New User',
            passwordHash: null,
            bio: null,
            profileImageUrl: 'https://example.com/avatar.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
            accounts: [
                {
                    id: 'account-new',
                    userId: 'user-new',
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: '67890',
                }
            ]
        };

        (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

        // Call the function
        const result = await findOrCreateOAuthUser(
            'google',
            '67890',
            {
                email: 'new@example.com',
                name: 'New User',
                image: 'https://example.com/avatar.jpg',
            }
        );

        // Verify result
        expect(result).toEqual({
            id: 'user-new',
            email: 'new@example.com',
            username: 'newuser',
            displayName: 'New User',
            bio: null,
            profileImageUrl: 'https://example.com/avatar.jpg',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            accounts: [
                {
                    id: 'account-new',
                    userId: 'user-new',
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: '67890',
                }
            ]
        });

        // Verify prisma calls
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                email: 'new@example.com',
                username: 'newuser',
                displayName: 'New User',
                profileImageUrl: 'https://example.com/avatar.jpg',
                accounts: {
                    create: {
                        type: 'oauth',
                        provider: 'google',
                        providerAccountId: '67890',
                    },
                },
            },
            include: {
                accounts: true,
            },
        });
    });

    it('should generate unique username when username exists', async () => {
        // Mock no existing account and no existing user but username conflict
        (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.user.findUnique as jest.Mock)
            .mockResolvedValueOnce(null) // No existing user with email
            .mockResolvedValueOnce({ id: 'existing-user' }) // Username exists
            .mockResolvedValueOnce(null); // Second username attempt is unique

        const mockNewUser = {
            id: 'user-new',
            email: 'new@example.com',
            username: 'newuser1',
            displayName: 'New User',
            passwordHash: null,
            bio: null,
            profileImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            accounts: [
                {
                    id: 'account-new',
                    userId: 'user-new',
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: '67890',
                }
            ]
        };

        (prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser);

        // Call the function
        const result = await findOrCreateOAuthUser(
            'google',
            '67890',
            {
                email: 'new@example.com',
                name: 'New User',
            }
        );

        // Verify result
        expect(result).toEqual({
            id: 'user-new',
            email: 'new@example.com',
            username: 'newuser1',
            displayName: 'New User',
            bio: null,
            profileImageUrl: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            accounts: [
                {
                    id: 'account-new',
                    userId: 'user-new',
                    type: 'oauth',
                    provider: 'google',
                    providerAccountId: '67890',
                }
            ]
        });

        // Verify prisma calls for username checks
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { username: 'newuser' },
        });
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { username: 'newuser1' },
        });
    });
});