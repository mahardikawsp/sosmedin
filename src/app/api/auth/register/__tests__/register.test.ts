import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createUser } from '@/lib/auth-utils';

// Mock the auth-utils
jest.mock('@/lib/auth-utils');

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;

describe('/api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a user successfully', async () => {
        const mockUser = {
            id: 'user1',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
        };

        mockCreateUser.mockResolvedValue(mockUser as any);

        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                displayName: 'Test User',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.message).toBe('User registered successfully');
        expect(data.user.email).toBe('test@example.com');
        expect(data.user.username).toBe('testuser');
        expect(mockCreateUser).toHaveBeenCalledWith({
            email: 'test@example.com',
            username: 'testuser',
            password: 'password123',
            displayName: 'Test User',
        });
    });

    it('should return 400 for invalid email', async () => {
        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'invalid-email',
                username: 'testuser',
                password: 'password123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid email address');
    });

    it('should return 400 for short password', async () => {
        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: '123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('should return 400 for invalid username', async () => {
        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'test-user!',
                password: 'password123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Username can only contain letters, numbers, and underscores');
    });

    it('should return 409 for duplicate email', async () => {
        mockCreateUser.mockRejectedValue(new Error('Email already in use'));

        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('Email already in use');
    });

    it('should return 409 for duplicate username', async () => {
        mockCreateUser.mockRejectedValue(new Error('Username already taken'));

        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toBe('Username already taken');
    });

    it('should return 500 for unexpected errors', async () => {
        mockCreateUser.mockRejectedValue(new Error('Database connection failed'));

        const request = new NextRequest('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
            }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('An error occurred during registration');
    });
});