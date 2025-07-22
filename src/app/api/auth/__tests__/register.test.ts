import { NextRequest } from 'next/server';
import { POST } from '../register/route';
import * as authUtils from '@/lib/auth-utils';

// Mock the auth-utils module
jest.mock('@/lib/auth-utils', () => ({
    createUser: jest.fn(),
}));

// Mock NextRequest
function createMockRequest(body: any) {
    return {
        json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
}

describe('Register API Endpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        // Mock user data
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            username: 'testuser',
            displayName: 'Test User',
        };

        // Mock createUser response
        const mockUser = {
            id: 'user-id',
            email: userData.email,
            username: userData.username,
            displayName: userData.displayName,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        (authUtils.createUser as jest.Mock).mockResolvedValue(mockUser);

        // Create mock request
        const request = createMockRequest(userData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(201);
        expect(responseData.message).toBe('User registered successfully');
        expect(responseData.user).toEqual(mockUser);

        // Verify createUser was called with correct data
        expect(authUtils.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return validation errors for invalid data', async () => {
        // Invalid user data (missing required fields)
        const userData = {
            email: 'invalid-email',
            password: '123', // too short
            username: 'a', // too short
        };

        // Create mock request
        const request = createMockRequest(userData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(400);
        expect(responseData.error).toBeDefined();

        // Verify createUser was not called
        expect(authUtils.createUser).not.toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
        // Mock user data
        const userData = {
            email: 'existing@example.com',
            password: 'password123',
            username: 'newuser',
        };

        // Mock createUser to throw an error
        (authUtils.createUser as jest.Mock).mockRejectedValue(new Error('Email already in use'));

        // Create mock request
        const request = createMockRequest(userData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(409);
        expect(responseData.error).toBe('Email already in use');
    });

    it('should handle duplicate username error', async () => {
        // Mock user data
        const userData = {
            email: 'new@example.com',
            password: 'password123',
            username: 'existinguser',
        };

        // Mock createUser to throw an error
        (authUtils.createUser as jest.Mock).mockRejectedValue(new Error('Username already taken'));

        // Create mock request
        const request = createMockRequest(userData);

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(409);
        expect(responseData.error).toBe('Username already taken');
    });

    it('should handle unexpected errors', async () => {
        // Mock user data
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            username: 'testuser',
        };

        // Mock createUser to throw an unexpected error
        (authUtils.createUser as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        // Create mock request
        const request = createMockRequest(userData);

        // Mock console.error to prevent test output pollution
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Call the endpoint
        const response = await POST(request);
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to register user');
    });
});