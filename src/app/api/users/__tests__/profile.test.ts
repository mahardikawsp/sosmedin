import { NextRequest } from 'next/server';
import { GET as getCurrentUser, PUT as updateCurrentUser } from '../me/route';

// Mock dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

const mockGetCurrentUserId = require('@/lib/session').getCurrentUserId;
const mockPrisma = require('@/lib/prisma').prisma;

describe('User Profile API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('GET /api/users/me', () => {
        it('should return current user profile when authenticated', async () => {
            const mockUser = {
                id: 'user1',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
                bio: 'Test bio',
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: {
                    posts: 5,
                    followedBy: 10,
                    following: 8,
                },
            };

            mockGetCurrentUserId.mockResolvedValue('user1');
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await getCurrentUser();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockUser);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user1' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    bio: true,
                    profileImageUrl: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            posts: true,
                            followedBy: true,
                            following: true,
                        },
                    },
                },
            });
        });

        it('should return 401 when not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const response = await getCurrentUser();
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should return 404 when user not found', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await getCurrentUser();
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });
    });

    describe('PUT /api/users/me', () => {
        it('should update user profile successfully', async () => {
            const mockUpdatedUser = {
                id: 'user1',
                email: 'test@example.com',
                username: 'newusername',
                displayName: 'New Display Name',
                bio: 'New bio',
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: {
                    posts: 5,
                    followedBy: 10,
                    following: 8,
                },
            };

            mockGetCurrentUserId.mockResolvedValue('user1');
            mockPrisma.user.findUnique.mockResolvedValue({ username: 'oldusername' });
            mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: 'New Display Name',
                    bio: 'New bio',
                    username: 'newusername',
                }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockUpdatedUser);
        });

        it('should return 401 when not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({ displayName: 'New Name' }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should validate display name length', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: 'a'.repeat(51), // Too long
                }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Display name cannot exceed 50 characters');
        });

        it('should validate bio length', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    bio: 'a'.repeat(161), // Too long
                }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Bio cannot exceed 160 characters');
        });

        it('should validate username format', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    username: 'invalid-username!', // Invalid characters
                }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Username must be 3-20 characters and contain only letters, numbers, and underscores');
        });

        it('should check for username uniqueness', async () => {
            mockGetCurrentUserId.mockResolvedValue('user1');
            mockPrisma.user.findUnique
                .mockResolvedValueOnce({ username: 'oldusername' }) // Current user
                .mockResolvedValueOnce({ id: 'user2' }); // Existing user with new username

            const request = new NextRequest('http://localhost/api/users/me', {
                method: 'PUT',
                body: JSON.stringify({
                    username: 'existingusername',
                }),
            });

            const response = await updateCurrentUser(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Username is already taken');
        });
    });
});