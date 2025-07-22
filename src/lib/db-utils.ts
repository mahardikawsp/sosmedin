import { prisma } from './prisma';

/**
 * Database utility functions for common operations
 */

/**
 * Checks if the database connection is healthy
 * @returns {Promise<boolean>} True if connection is successful
 */
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

/**
 * Safely closes the database connection
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error disconnecting from database:', error);
        throw error;
    }
}

/**
 * Executes a database transaction
 * @param fn Function to execute within transaction
 * @returns Result of the transaction function
 */
export async function executeTransaction<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await prisma.$transaction(async (tx) => {
            return await fn();
        });
    } catch (error) {
        console.error('Transaction error:', error);
        throw error;
    }
}

/**
 * Performs a health check on the database
 * @returns {Promise<{status: string, message: string}>} Health check result
 */
export async function getDatabaseHealth(): Promise<{ status: string; message: string }> {
    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const end = Date.now();
        const responseTime = end - start;

        return {
            status: 'healthy',
            message: `Database connection successful (${responseTime}ms)`,
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            message: `Database connection failed: ${(error as Error).message}`,
        };
    }
}