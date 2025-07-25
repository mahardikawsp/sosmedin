import { NextRequest } from 'next/server';
import { POST as uploadProfileImage } from '../[username]/profile-image/route';

// Mock dependencies
jest.mock('@/lib/session', () => ({
    getCurrentUserId: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

describe('/api/users/[username]/profile-image', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/users/[username]/profile-image', () => {
        it('should upload profile image successfully', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            const updatedUser = {
                id: 'user-1',
                username: 'testuser',
                displayName: 'Test User',
                bio: 'Test bio',
                profileImageUrl: 'https://storage.example.com/profiles/user-1_123456_test.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

            // Create a mock file
            const mockFile = new File(['test image content'], 'test.jpg', {
                type: 'image/jpeg',
            });

            const formData = new FormData();
            formData.append('image', mockFile);

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('Profile image uploaded successfully');
            expect(data.profile.profileImageUrl).toContain('storage.example.com');
        });

        it('should return 401 if user is not authenticated', async () => {
            mockGetCurrentUserId.mockResolvedValue(null);

            const formData = new FormData();
            formData.append('image', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should return 404 if user not found', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const formData = new FormData();
            formData.append('image', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

            const request = new NextRequest('http://localhost:3000/api/users/nonexistent/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'nonexistent' } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });

        it('should return 403 if user tries to upload image for another user', async () => {
            mockGetCurrentUserId.mockResolvedValue('different-user-id');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const formData = new FormData();
            formData.append('image', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Forbidden');
        });

        it('should return 400 if no image file provided', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const formData = new FormData();
            // No image file added

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('No image file provided');
        });

        it('should return 400 for invalid file type', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const mockFile = new File(['test content'], 'test.txt', {
                type: 'text/plain',
            });

            const formData = new FormData();
            formData.append('image', mockFile);

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid file type. Supported types: JPEG, PNG, GIF, WebP');
        });

        it('should return 400 for file size exceeding limit', async () => {
            mockGetCurrentUserId.mockResolvedValue('user-1');

            const mockUser = { id: 'user-1' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            // Create a mock file that exceeds 5MB
            const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
            const mockFile = new File([largeContent], 'large.jpg', {
                type: 'image/jpeg',
            });

            const formData = new FormData();
            formData.append('image', mockFile);

            const request = new NextRequest('http://localhost:3000/api/users/testuser/profile-image', {
                method: 'POST',
                body: formData,
            });

            const response = await uploadProfileImage(request, { params: { username: 'testuser' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('File size exceeds the 5MB limit');
        });
    });
});