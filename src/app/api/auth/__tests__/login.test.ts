import { NextRequest } from 'next/server';
import { POST } from '../login/route';
import * as authUtils from '@/lib/auth-utils';

// Mock the auth-utils module
jest.mock('@/lib/auth-utils', () => ({
    authenticateUser: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        set: jest.fn(),
    })),
}));

// Mock NextRequest
function createMockRequest(body: any) {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
}

describe('Login API Endpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should login a user successfully', async () => {
        // Mock login data
        const loginData = {
            email: 'test@example.com',
            password: 'password123',
        };

        // Mock authenticateUser response
        const mockUser = {
            id: 'user-id',
            email: loginData.email,
            username: 'testuser',
            displayName: 'Test User',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const mockToken = 'mock-jwt-token';

        (authUtils.authenticateUser as jest.Mock).mockResolvedValue({
            user: mockUser,
            token: mockToken,
        });

        // Create mock request
        const request = createMockRequest(loginData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(200);
        expect(responseData.message).toBe('Login successful');
        expect(responseData.user).toEqual(mockUser);

        // Verify authenticateUser was called with correct data
        expect(authUtils.authenticateUser).toHaveBeenCalledWith(loginData.email, loginData.password);
    });

    it('should return validation errors for invalid data', async () => {
        // Invalid login data
        const loginData = {
            email: 'invalid-email',
            password: '', // empty password
        };

        // Create mock request
        const request = createMockRequest(loginData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();

        // Verify authenticateUser was not called
        expect(authUtils.authenticateUser).not.toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
        // Mock login data
        const loginData = {
            email: 'test@example.com',
            password: 'wrongpassword',
        };

        // Mock authenticateUser to throw an error
        (authUtils.authenticateUser as jest.Mock).mockRejectedValue(new Error('Invalid email or password'));

        // Create mock request
        const request = createMockRequest(loginData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(401);
        expect(responseData.error).toBe('Invalid email or password');
    });

    it('should handle unexpected errors', async () => {
        // Mock login data
        const loginData = {
            email: 'test@example.com',
            password: 'password123',
        };

        // Mock authenticateUser to throw an unexpected error
        (authUtils.authenticateUser as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        // Create mock request
        const request = createMockRequest(loginData);

        // Mock console.error to prevent test output pollution
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to authenticate user');
    });
});