import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { User } from '@prisma/client';

// Constants
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// OAuth provider types
export type OAuthProvider = 'google' | 'github' | 'facebook';

/**
 * Authentication utility functions
 */

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 * @param password Plain text password
 * @param hashedPassword Hashed password
 * @returns True if password matches hash
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export function generateToken(user: { id: string; email: string }): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
}

/**
 * Verify a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { id: string; email: string } | null {
    try {
        return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    } catch (error) {
        return null;
    }
}

/**
 * Create a new user
 * @param userData User data
 * @returns Created user
 */
export async function createUser(userData: {
    email: string;
    password: string;
    username: string;
    displayName?: string;
}): Promise<Omit<User, 'passwordHash'>> {
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email: userData.email }, { username: userData.username }],
        },
    });

    if (existingUser) {
        if (existingUser.email === userData.email) {
            throw new Error('Email already in use');
        }
        if (existingUser.username === userData.username) {
            throw new Error('Username already taken');
        }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            passwordHash,
            username: userData.username,
            displayName: userData.displayName || userData.username,
        },
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Authenticate a user with email and password
 * @param email User email
 * @param password User password
 * @returns User object and token if authentication successful
 */
export async function authenticateUser(email: string, password: string): Promise<{
    user: Omit<User, 'passwordHash'>;
    token: string;
}> {
    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
    }

    // Compare password
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
        throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        token,
    };
}

/**
 * Get user by ID
 * @param userId User ID
 * @returns User object without password hash
 */
export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return null;
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}
/**

 * Find or create a user from OAuth profile data
 * @param provider OAuth provider name
 * @param providerAccountId Provider's account ID
 * @param profile User profile data from provider
 * @returns User object without password hash
 */
export async function findOrCreateOAuthUser(
    provider: OAuthProvider,
    providerAccountId: string,
    profile: {
        email: string;
        name?: string;
        image?: string;
    }
): Promise<Omit<User, 'passwordHash'>> {
    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
        where: {
            provider_providerAccountId: {
                provider,
                providerAccountId,
            },
        },
        include: {
            user: true,
        },
    });

    // If account exists, return the user
    if (existingAccount) {
        const { passwordHash: _, ...userWithoutPassword } = existingAccount.user;
        return userWithoutPassword;
    }

    // Check if user exists with the same email
    const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
    });

    if (existingUser) {
        // Link new OAuth account to existing user
        await prisma.account.create({
            data: {
                userId: existingUser.id,
                type: 'oauth',
                provider,
                providerAccountId,
            },
        });

        // Return existing user
        const { passwordHash: _, ...userWithoutPassword } = existingUser;
        return userWithoutPassword;
    }

    // Generate a username from the email or name
    let baseUsername = profile.name
        ? profile.name.replace(/\s+/g, '').toLowerCase()
        : profile.email.split('@')[0].toLowerCase();

    let username = baseUsername;
    let counter = 1;

    // Check if username exists and generate a unique one
    while (true) {
        const existingUsername = await prisma.user.findUnique({
            where: { username },
        });

        if (!existingUsername) break;

        username = `${baseUsername}${counter}`;
        counter++;
    }

    // Create new user and account
    const newUser = await prisma.user.create({
        data: {
            email: profile.email,
            username,
            displayName: profile.name || username,
            profileImageUrl: profile.image,
            accounts: {
                create: {
                    type: 'oauth',
                    provider,
                    providerAccountId,
                },
            },
        },
        include: {
            accounts: true,
        },
    });

    // Return new user without password hash
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}