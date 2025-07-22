import { hashPassword, comparePassword, generateToken, verifyToken } from '../auth-utils';

// Mock the prisma client
jest.mock('../prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

describe('Authentication Utilities', () => {
    describe('Password Hashing', () => {
        it('should hash a password', async () => {
            const password = 'test-password';
            const hashedPassword = await hashPassword(password);

            // Hashed password should be different from original
            expect(hashedPassword).not.toBe(password);

            // Hashed password should be a string
            expect(typeof hashedPassword).toBe('string');

            // Hashed password should be longer than original (due to salt)
            expect(hashedPassword.length).toBeGreaterThan(password.length);
        });

        it('should verify a correct password', async () => {
            const password = 'test-password';
            const hashedPassword = await hashPassword(password);

            const isMatch = await comparePassword(password, hashedPassword);
            expect(isMatch).toBe(true);
        });

        it('should reject an incorrect password', async () => {
            const password = 'test-password';
            const wrongPassword = 'wrong-password';
            const hashedPassword = await hashPassword(password);

            const isMatch = await comparePassword(wrongPassword, hashedPassword);
            expect(isMatch).toBe(false);
        });
    });

    describe('JWT Tokens', () => {
        it('should generate a token for a user', () => {
            const user = { id: 'user-id', email: 'test@example.com' };
            const token = generateToken(user);

            // Token should be a string
            expect(typeof token).toBe('string');

            // Token should not be empty
            expect(token.length).toBeGreaterThan(0);
        });

        it('should verify a valid token', () => {
            const user = { id: 'user-id', email: 'test@example.com' };
            const token = generateToken(user);

            const decoded = verifyToken(token);

            // Decoded token should contain user data
            expect(decoded).not.toBeNull();
            expect(decoded?.id).toBe(user.id);
            expect(decoded?.email).toBe(user.email);
        });

        it('should reject an invalid token', () => {
            const invalidToken = 'invalid-token';

            const decoded = verifyToken(invalidToken);

            // Decoded token should be null
            expect(decoded).toBeNull();
        });
    });
});