// In-memory cache implementation for better performance
// In production, this should be replaced with Redis or similar

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class MemoryCache {
    private cache = new Map<string, CacheItem<any>>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired items every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    set<T>(key: string, data: T, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000,
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        const item = this.cache.get(key);

        if (!item) {
            return false;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    size(): number {
        return this.cache.size;
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    // Cache wrapper for async functions
    async withCache<T>(
        key: string,
        fn: () => Promise<T>,
        ttlSeconds: number = 300
    ): Promise<T> {
        // Try to get from cache first
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Execute function and cache result
        const result = await fn();
        this.set(key, result, ttlSeconds);
        return result;
    }

    // Batch operations
    mget<T>(keys: string[]): (T | null)[] {
        return keys.map(key => this.get<T>(key));
    }

    mset<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
        items.forEach(({ key, data, ttl = 300 }) => {
            this.set(key, data, ttl);
        });
    }

    // Pattern-based operations
    deletePattern(pattern: string): number {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        let deletedCount = 0;

        for (const key of Array.from(this.cache.keys())) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }

        return deletedCount;
    }

    getByPattern<T>(pattern: string): Array<{ key: string; data: T }> {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const results: Array<{ key: string; data: T }> = [];

        for (const [key, item] of Array.from(this.cache.entries())) {
            if (regex.test(key)) {
                // Check if item has expired
                if (Date.now() - item.timestamp <= item.ttl) {
                    results.push({ key, data: item.data });
                } else {
                    this.cache.delete(key);
                }
            }
        }

        return results;
    }

    // Statistics
    getStats() {
        let totalSize = 0;
        let expiredCount = 0;
        const now = Date.now();

        for (const [key, item] of Array.from(this.cache.entries())) {
            totalSize++;
            if (now - item.timestamp > item.ttl) {
                expiredCount++;
            }
        }

        return {
            totalItems: totalSize,
            expiredItems: expiredCount,
            activeItems: totalSize - expiredCount,
            memoryUsage: process.memoryUsage(),
        };
    }

    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, item] of Array.from(this.cache.entries())) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (process.env.NODE_ENV === 'development' && cleanedCount > 0) {
            console.log(`Cache cleanup: removed ${cleanedCount} expired items`);
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Singleton pattern to prevent multiple instances
const globalForCache = globalThis as unknown as { cache: MemoryCache | undefined };

// Global cache instance
export const cache = globalForCache.cache ?? new MemoryCache();

if (process.env.NODE_ENV !== 'production') {
    globalForCache.cache = cache;
}

// Cache decorators for functions
export function cached<T extends any[], R>(
    keyGenerator: (...args: T) => string,
    ttlSeconds: number = 300
) {
    return function (
        target: any,
        propertyName: string,
        descriptor: PropertyDescriptor
    ) {
        const method = descriptor.value;

        descriptor.value = async function (...args: T): Promise<R> {
            const key = keyGenerator(...args);
            return cache.withCache(key, () => method.apply(this, args), ttlSeconds);
        };

        return descriptor;
    };
}

// Utility functions for common cache patterns
export const CacheUtils = {
    // User-specific cache key
    userKey: (userId: string, suffix: string) => `user:${userId}:${suffix}`,

    // Post-specific cache key
    postKey: (postId: string, suffix: string) => `post:${postId}:${suffix}`,

    // Feed cache key
    feedKey: (type: string, userId?: string, cursor?: string) =>
        `feed:${type}:${userId || 'anonymous'}:${cursor || 'start'}`,

    // Search cache key
    searchKey: (query: string, type: string) => `search:${type}:${query}`,

    // Notification cache key
    notificationKey: (userId: string, cursor?: string) =>
        `notifications:${userId}:${cursor || 'start'}`,

    // Invalidate user-related caches
    invalidateUserCaches: (userId: string) => {
        cache.deletePattern(`user:${userId}:*`);
        cache.deletePattern(`feed:*:${userId}:*`);
        cache.deletePattern(`notifications:${userId}:*`);
    },

    // Invalidate post-related caches
    invalidatePostCaches: (postId: string) => {
        cache.deletePattern(`post:${postId}:*`);
        cache.deletePattern('feed:*'); // Invalidate all feeds when posts change
    },

    // Warm up cache with common queries
    warmUpCache: async () => {
        // This would be called during application startup
        // to pre-populate cache with frequently accessed data
        console.log('Warming up cache...');
        // Implementation would depend on your specific use cases
    },
};

// Graceful shutdown - only add listener once
let shutdownListenerAdded = false;
if (!shutdownListenerAdded) {
    process.on('beforeExit', () => {
        cache.destroy();
    });
    shutdownListenerAdded = true;
}