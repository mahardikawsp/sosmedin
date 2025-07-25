import { POST } from '../register/route';
import { createUser } from '@/lib/auth-utils';
import { NextRequest } from 'next/server';

// Mock the auth-utils module
jest.mock('@/lib/auth-utils', () => ({
    createUser: jest.fn(),
}));

describe('Register API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        // Mock createUser to return a successful response
        const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
            bio: null,
            profileImageUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        (createUser as jest.Mock).mockResolvedValue(mockUser);

        // Create mock request
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                displayName: 'Test User',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(201);
        expect(data).toEqual({
            message: 'User registered successfully',
            user: {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Test User',
            },
        });

        // Verify createUser was called with correct parameters
        expect(createUser).toHaveBeenCalledWith({
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
            displayName: 'Test User',
        });
    });

    it('should return validation error for invalid email', async () => {
        // Create mock request with invalid email
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'invalid-email',
                username: 'testuser',
                password: 'password123',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(400);
        expect(data.error).toContain('Invalid email');

        // Verify createUser was not called
        expect(createUser).not.toHaveBeenCalled();
    });

    it('should return validation error for short password', async () => {
        // Create mock request with short password
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'short',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(400);
        expect(data.error).toContain('Password must be at least 8 characters');

        // Verify createUser was not called
        expect(createUser).not.toHaveBeenCalled();
    });

    it('should return validation error for invalid username', async () => {
        // Create mock request with invalid username
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'test user!',
                password: 'password123',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(400);
        expect(data.error).toContain('Username can only contain');

        // Verify createUser was not called
        expect(createUser).not.toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
        // Mock createUser to throw an error for duplicate email
        (createUser as jest.Mock).mockRejectedValue(new Error('Email already in use'));

        // Create mock request
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'existing@example.com',
                username: 'newuser',
                password: 'password123',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(409);
        expect(data.error).toBe('Email already in use');
    });

    it('should handle duplicate username error', async () => {
        // Mock createUser to throw an error for duplicate username
        (createUser as jest.Mock).mockRejectedValue(new Error('Username already taken'));

        // Create mock request
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'new@example.com',
                username: 'existinguser',
                password: 'password123',
            }),
        });

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Verify response
        expect(response.status).toBe(409);
        expect(data.error).toBe('Username already taken');
    });

    it('should handle unexpected errors', async () => {
        // Mock createUser to throw an unexpected error
        (createUser as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        // Create mock request
        const request = new NextRequest('http://localhost:3000/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            }),
        });

        // Mock console.error to prevent test output pollution
        const originalConsoleError = console.error;
        console.error = jest.fn();

        // Call the API handler
        const response = await POST(request);
        const data = await response.json();

        // Restore console.error
        console.error = originalConsoleError;

        // Verify response
        expect(response.status).toBe(500);
        expect(data.error).toBe('An error occurred during registration');
    });
});