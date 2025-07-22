import { POST } from '../logout/route';

// Mock Next.js cookies
const mockCookieStore = {
    delete: jest.fn(),
};

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => mockCookieStore),
}));

describe('Logout API Endpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should logout a user successfully', async () => {
        // Call the endpoint
        const response = await POST();
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(200);
        expect(responseData.message).toBe('Logout successful');

        // Verify cookie was deleted
        expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token');
    });

    it('should handle unexpected errors', async () => {
        // Mock cookie deletion to throw an error
        mockCookieStore.delete.mockImplementation(() => {
            throw new Error('Cookie store error');
        });

        // Mock console.error to prevent test output pollution
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Call the endpoint
        const response = await POST();
        const responseData = await response.json();

        // Verify response
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to logout');
    });
});