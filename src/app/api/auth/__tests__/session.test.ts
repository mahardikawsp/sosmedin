import { NextRequest } from 'next/server';
import { GET } from '../session/route';
import * as authUtils from '@/lib/auth-utils';

// Mock the auth-utils module
jest.mock('@/lib/auth-utils', () => ({
    verifyToken: jest.fn(),
    getUserById: jest.fn(),
}));

// Mock Next.js cookies
const mockCookieStore = {
    get: jest.fn(),
    delete: jest.fn(),
};

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => mockCookieStore),
}));

describe('Session API Endpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return authenticated user session', async () => {
        // Mock token in cookies
        mockCookieStore.get.mockReturnValue({ value: 'valid-token' });

        // Mock token verification
        const mockDecodedToken = { id: 'user-id', email: 'test@example.com' };
        (authUtils.verifyToken as jest.Mock).mockReturnValue(mockDecodedToken);

        // Mock user data
        const mockUser = {
            id: 'user-id',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        (authUtils.getUserById as jest.Mock).mockResolvedValue(mockUser);

        // Call the endpoint
        const request = {} as NextRequest;
        const response = await GET(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(200);
        expect(responseData.authenticated).toBe(true);
        expect(responseData.user).toEqual(mockUser);

        // Verify function calls
        expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
        expect(authUtils.verifyToken).toHaveBeenCalledWith('valid-token');
        expect(authUtils.getUserById).toHaveBeenCalledWith('user-id');
    });

    it('should return unauthenticated when no token is present', async () => {
        // Mock no token in cookies
        mockCookieStore.get.mockReturnValue(undefined);

        // Call the endpoint
        const request = {} as NextRequest;
        const response = await GET(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(401);
        expect(responseData.authenticated).toBe(false);

        // Verify function calls
        expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
        expect(authUtils.verifyToken).not.toHaveBeenCalled();
        expect(authUtils.getUserById).not.toHaveBeenCalled();
    });

    it('should return unauthenticated when token is invalid', async () => {
        // Mock token in cookies
        mockCookieStore.get.mockReturnValue({ value: 'invalid-token' });

        // Mock token verification failure
        (authUtils.verifyToken as jest.Mock).mockReturnValue(null);

        // Call the endpoint
        const request = {} as NextRequest;
        const response = await GET(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(401);
        expect(responseData.authenticated).toBe(false);

        // Verify function calls
        expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
        expect(authUtils.verifyToken).toHaveBeenCalledWith('invalid-token');
        expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
        expect(authUtils.getUserById).not.toHaveBeenCalled();
    });

    it('should return unauthenticated when user is not found', async () => {
        // Mock token in cookies
        mockCookieStore.get.mockReturnValue({ value: 'valid-token' });

        // Mock token verification
        const mockDecodedToken = { id: 'user-id', email: 'test@example.com' };
        (authUtils.verifyToken as jest.Mock).mockReturnValue(mockDecodedToken);

        // Mock user not found
        (authUtils.getUserById as jest.Mock).mockResolvedValue(null);

        // Call the endpoint
        const request = {} as NextRequest;
        const response = await GET(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(401);
        expect(responseData.authenticated).toBe(false);

        // Verify function calls
        expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token');
        expect(authUtils.verifyToken).toHaveBeenCalledWith('valid-token');
        expect(authUtils.getUserById).toHaveBeenCalledWith('user-id');
        expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
    });

    it('should handle unexpected errors', async () => {
        // Mock token in cookies
        mockCookieStore.get.mockReturnValue({ value: 'valid-token' });

        // Mock token verification
        const mockDecodedToken = { id: 'user-id', email: 'test@example.com' };
        (authUtils.verifyToken as jest.Mock).mockReturnValue(mockDecodedToken);

        // Mock getUserById to throw an error
        (authUtils.getUserById as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Mock console.error to prevent test output pollution
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Call the endpoint
        const request = {} as NextRequest;
        const response = await GET(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to get session');
    });
});