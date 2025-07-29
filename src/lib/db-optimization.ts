import { PrismaClient } from '@prisma/client';


// Database connection pool optimization
export function createOptimizedPrismaClient(): PrismaClient {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
}

// Query optimization utilities
export class QueryOptimizer {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Optimized feed query with pagination
    async getOptimizedFeed(userId: string, cursor?: string, limit: number = 20) {
        const where = cursor ? { id: { lt: cursor } } : {};

        return this.prisma.post.findMany({
            where: {
                ...where,
                OR: [
                    // Posts from followed users
                    {
                        user: {
                            followedBy: {
                                some: {
                                    followerId: userId,
                                },
                            },
                        },
                    },
                    // User's own posts
                    {
                        userId: userId,
                    },
                ],
                parentId: null, // Only top-level posts
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: {
                    where: {
                        userId: userId,
                    },
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    // Optimized user posts query
    async getUserPosts(username: string, cursor?: string, limit: number = 20) {
        const where = cursor ? { id: { lt: cursor } } : {};

        return this.prisma.post.findMany({
            where: {
                ...where,
                user: {
                    username: username,
                },
                parentId: null, // Only top-level posts
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    // Optimized search query
    async searchPosts(query: string, cursor?: string, limit: number = 20) {
        const where = cursor ? { id: { lt: cursor } } : {};

        return this.prisma.post.findMany({
            where: {
                ...where,
                content: {
                    contains: query,
                    mode: 'insensitive',
                },
                parentId: null, // Only top-level posts
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    // Batch operations for better performance
    async batchCreateNotifications(notifications: Array<{
        userId: string;
        type: string;
        referenceId?: string;
    }>) {
        return this.prisma.notification.createMany({
            data: notifications,
            skipDuplicates: true,
        });
    }

    // Optimized notification query
    async getUserNotifications(userId: string, cursor?: string, limit: number = 20) {
        const where = cursor ? { id: { lt: cursor } } : {};

        return this.prisma.notification.findMany({
            where: {
                ...where,
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    // Database maintenance queries
    async cleanupOldNotifications(daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return this.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                isRead: true,
            },
        });
    }

    // Analytics queries with aggregation
    async getUserStats(userId: string) {
        const [postsCount, followersCount, followingCount, likesReceived] = await Promise.all([
            this.prisma.post.count({
                where: { userId, parentId: null },
            }),
            this.prisma.follow.count({
                where: { followingId: userId },
            }),
            this.prisma.follow.count({
                where: { followerId: userId },
            }),
            this.prisma.like.count({
                where: {
                    post: {
                        userId: userId,
                    },
                },
            }),
        ]);

        return {
            postsCount,
            followersCount,
            followingCount,
            likesReceived,
        };
    }

    // Trending posts query (optimized for performance)
    async getTrendingPosts(limit: number = 20, hoursBack: number = 24, userId?: string) {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

        return this.prisma.post.findMany({
            where: {
                createdAt: {
                    gte: cutoffDate,
                },
                parentId: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profileImageUrl: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
                likes: userId ? {
                    where: { userId },
                    select: { id: true },
                } : false,
            },
            orderBy: [
                {
                    likes: {
                        _count: 'desc',
                    },
                },
                {
                    replies: {
                        _count: 'desc',
                    },
                },
                {
                    createdAt: 'desc',
                },
            ],
            take: limit,
        });
    }
}

// Connection pooling and caching utilities
export class DatabaseCache {
    private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

    set(key: string, data: any, ttlSeconds: number = 300) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000,
        });
    }

    get(key: string): any | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    clear() {
        this.cache.clear();
    }

    // Cache wrapper for database queries
    async withCache<T>(
        key: string,
        queryFn: () => Promise<T>,
        ttlSeconds: number = 300
    ): Promise<T> {
        const cached = this.get(key);
        if (cached) return cached;

        const result = await queryFn();
        this.set(key, result, ttlSeconds);
        return result;
    }
}

// Use the global cache instance
import { cache } from './cache';
export const dbCache = cache;