import { authOptions } from '@/lib/auth';

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// Mock the auth-utils
jest.mock('@/lib/auth-utils', () => ({
    comparePassword: jest.fn(),
}));

// Mock the custom-prisma-adapter
jest.mock('@/lib/custom-prisma-adapter', () => ({
    CustomPrismaAdapter: jest.fn(() => ({})),
}));

describe('OAuth Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should have Google provider configured', () => {
        // Check if Google provider is configured
        const googleProvider = authOptions.providers.find(
            (provider) => provider.id === 'google'
        );

        expect(googleProvider).toBeDefined();
        expect(googleProvider?.name).toBe('Google');
    });

    it('should have credentials provider configured', () => {
        // Check if credentials provider is configured
        const credentialsProvider = authOptions.providers.find(
            (provider) => provider.id === 'credentials'
        );

        expect(credentialsProvider).toBeDefined();
        expect(credentialsProvider?.name).toBe('Credentials');
    });

    it('should have custom pages configured', () => {
        // Check if custom pages are configured
        expect(authOptions.pages).toEqual({
            signIn: '/login',
            error: '/login',
        });
    });

    it('should use JWT strategy for sessions', () => {
        // Check if JWT strategy is configured
        expect(authOptions.session.strategy).toBe('jwt');
        expect(authOptions.session.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });

    it('should have JWT callback configured', () => {
        // Check if JWT callback is configured
        expect(typeof authOptions.callbacks.jwt).toBe('function');
    });

    it('should have session callback configured', () => {
        // Check if session callback is configured
        expect(typeof authOptions.callbacks.session).toBe('function');
    });

    it('should have signIn callback configured', () => {
        // Check if signIn callback is configured
        expect(typeof authOptions.callbacks.signIn).toBe('function');
    });
});