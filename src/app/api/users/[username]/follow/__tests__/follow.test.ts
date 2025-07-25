import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';

// Mock the dependencies
jest.mock('@/lib/session');
jest.mock('@/lib/prisma');

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = jest.mocked(getCurrentUserId);
const mockPrisma = jest.mocked(prisma, true);

describe('/api/users/[username]/follow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/users/[username]/follow', () => {
        it('should follow a user successfully', async () => {
            const currentUserId = 'user-123';
            const username = 'targetuser';
            const userToFollow = {
                id: 'target-user-123',
                username,
            };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.user.findUnique.mockResolvedValue(userToFollow as any);
            mockPrisma.follow.findUnique.mockResolvedValue(null);
            mockPrisma.follow.create.mockResolvedValue({} as any);
            mockPrisma.notification.create.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/users/${username}/follow`, {
                method: 'POST',
            });

            const response = await POST(request, { params: { username } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe(`Successfully followed ${username}`);
            expect(result.isFollowing).toBe(true);
            expect(mockPrisma.follow.create).toHaveBeenCalledWith({
                data: {
                    followerId: currentUserId,
                    followingId: userToFollow.id,
                },
            });
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: userToFollow.id,
                    type: 'follow',
                    referenceId: currentUserId,
                },
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/testuser/follow', {
                method: 'POST',
            });

            const response = await POST(request, { params: { username: 'testuser' } });
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 404 if user to follow does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/nonexistent/follow', {
                method: 'POST',
            });

            const response = await POST(request, { params: { username: 'nonexistent' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('User not found');
        });

        it('should return 400 if trying to follow themselves', async () => {
            const userId = 'user-123';
            const userToFollow = {
                id: userId, // Same as current user
                username: 'testuser',
            };

            mockGetCurrentUserId.mockResolvedValue(userId);
            mockPrisma.user.findUnique.mockResolvedValue(userToFollow as any);

            const request = new NextRequest('http://localhost/api/users/testuser/follow', {
                method: 'POST',
            });

            const response = await POST(request, { params: { username: 'testuser' } });
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Cannot follow yourself');
        });

        it('should return 400 if already following the user', async () => {
            const currentUserId = 'user-123';
            const userToFollow = {
                id: 'target-user-123',
                username: 'targetuser',
            };
            const existingFollow = { id: 'follow-123' };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.user.findUnique.mockResolvedValue(userToFollow as any);
            mockPrisma.follow.findUnique.mockResolvedValue(existingFollow as any);

            const request = new NextRequest('http://localhost/api/users/targetuser/follow', {
                method: 'POST',
            });

            const response = await POST(request, { params: { username: 'targetuser' } });
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Already following this user');
        });
    });

    describe('DELETE /api/users/[username]/follow', () => {
        it('should unfollow a user successfully', async () => {
            const currentUserId = 'user-123';
            const username = 'targetuser';
            const userToUnfollow = {
                id: 'target-user-123',
                username,
            };
            const existingFollow = { id: 'follow-123' };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.user.findUnique.mockResolvedValue(userToUnfollow as any);
            mockPrisma.follow.findUnique.mockResolvedValue(existingFollow as any);
            mockPrisma.follow.delete.mockResolvedValue({} as any);

            const request = new NextRequest(`http://localhost/api/users/${username}/follow`, {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { username } });
            const result = await response.json();

            expect(response.status).toBe(200);
            expect(result.message).toBe(`Successfully unfollowed ${username}`);
            expect(result.isFollowing).toBe(false);
            expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: userToUnfollow.id,
                    },
                },
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/testuser/follow', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { username: 'testuser' } });
            const result = await response.json();

            expect(response.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should return 404 if user to unfollow does not exist', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-123');
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/nonexistent/follow', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { username: 'nonexistent' } });
            const result = await response.json();

            expect(response.status).toBe(404);
            expect(result.error).toBe('User not found');
        });

        it('should return 400 if not currently following the user', async () => {
            const currentUserId = 'user-123';
            const userToUnfollow = {
                id: 'target-user-123',
                username: 'targetuser',
            };

            mockGetCurrentUserId.mockResolvedValue(currentUserId);
            mockPrisma.user.findUnique.mockResolvedValue(userToUnfollow as any);
            mockPrisma.follow.findUnique.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/users/targetuser/follow', {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { username: 'targetuser' } });
            const result = await response.json();

            expect(response.status).toBe(400);
            expect(result.error).toBe('Not following this user');
        });
    });
});