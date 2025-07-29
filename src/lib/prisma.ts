import { PrismaClient } from '@prisma/client';


// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

// Connection pool optimization for production
if (process.env.NODE_ENV === 'production') {
    // Ensure connection is established
    prisma.$connect();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown - only add listener once
let prismaShutdownListenerAdded = false;
if (!prismaShutdownListenerAdded) {
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
    prismaShutdownListenerAdded = true;
}

// Performance monitoring for database queries
if (process.env.NODE_ENV === 'development') {
    prisma.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();

        console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);

        // Log slow queries
        if (after - before > 1000) {
            console.warn(`Slow query detected: ${params.model}.${params.action} took ${after - before}ms`);
        }

        return result;
    });
}