import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Response compression utility
export function compressResponse(data: any): string {
    const jsonString = JSON.stringify(data);

    // Simple compression for repeated patterns
    if (jsonString.length > 1000) {
        // In a real implementation, you might use gzip or brotli
        return jsonString;
    }

    return jsonString;
}

// API response caching
const responseCache = new Map<string, { data: any; timestamp: number; etag: string }>();

export function generateETag(data: any): string {
    // Simple ETag generation based on content hash
    const content = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`;
}

export function withApiCache(
    handler: (req: NextRequest) => Promise<NextResponse>,
    ttlSeconds: number = 300
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const cacheKey = `${req.method}:${req.url}`;
        const cached = responseCache.get(cacheKey);

        // Check if cached response is still valid
        if (cached && Date.now() - cached.timestamp < ttlSeconds * 1000) {
            const ifNoneMatch = req.headers.get('if-none-match');

            if (ifNoneMatch === cached.etag) {
                return new NextResponse(null, { status: 304 });
            }

            return NextResponse.json(cached.data, {
                headers: {
                    'ETag': cached.etag,
                    'Cache-Control': `public, max-age=${ttlSeconds}`,
                },
            });
        }

        // Execute handler and cache response
        const response = await handler(req);

        if (response.status === 200) {
            const data = await response.json();
            const etag = generateETag(data);

            responseCache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                etag,
            });

            return NextResponse.json(data, {
                headers: {
                    'ETag': etag,
                    'Cache-Control': `public, max-age=${ttlSeconds}`,
                },
            });
        }

        return response;
    };
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    maxRequests: number = 100,
    windowMs: number = 60000 // 1 minute
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const clientId = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        const now = Date.now();
        const windowStart = now - windowMs;

        let rateLimitInfo = rateLimitMap.get(clientId);

        if (!rateLimitInfo || rateLimitInfo.resetTime < windowStart) {
            rateLimitInfo = { count: 0, resetTime: now + windowMs };
            rateLimitMap.set(clientId, rateLimitInfo);
        }

        if (rateLimitInfo.count >= maxRequests) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil(rateLimitInfo.resetTime / 1000).toString(),
                    },
                }
            );
        }

        rateLimitInfo.count++;

        const response = await handler(req);

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', (maxRequests - rateLimitInfo.count).toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000).toString());

        return response;
    };
}

// Request/Response logging and monitoring
export function withApiMonitoring(
    handler: (req: NextRequest) => Promise<NextResponse>
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const startTime = performance.now();
        const method = req.method;
        const url = req.url;

        try {
            const response = await handler(req);
            const duration = performance.now() - startTime;

            // Log API performance
            if (process.env.NODE_ENV === 'development') {
                console.log(`${method} ${url} - ${response.status} - ${duration.toFixed(2)}ms`);
            }

            // Log slow requests
            if (duration > 1000) {
                console.warn(`Slow API request: ${method} ${url} took ${duration.toFixed(2)}ms`);
            }

            // Add performance headers
            response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

            return response;
        } catch (error) {
            const duration = performance.now() - startTime;
            console.error(`API error: ${method} ${url} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    };
}

// Pagination utilities
export interface PaginationOptions {
    cursor?: string;
    limit?: number;
    maxLimit?: number;
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationOptions {
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(
        parseInt(searchParams.get('limit') || '20'),
        100 // Max limit
    );

    return { cursor, limit };
}

export function createPaginationResponse<T>(
    items: T[],
    limit: number,
    getItemId: (item: T) => string
) {
    const hasMore = items.length === limit;
    const nextCursor = hasMore ? getItemId(items[items.length - 1]) : null;

    return {
        items: hasMore ? items.slice(0, -1) : items,
        hasMore,
        nextCursor,
    };
}

// Request validation and sanitization
export function sanitizeInput(input: any): any {
    if (typeof input === 'string') {
        return input.trim().slice(0, 10000); // Limit string length
    }

    if (Array.isArray(input)) {
        return input.slice(0, 100).map(sanitizeInput); // Limit array size
    }

    if (typeof input === 'object' && input !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(input)) {
            if (typeof key === 'string' && key.length < 100) {
                sanitized[key] = sanitizeInput(value);
            }
        }
        return sanitized;
    }

    return input;
}

// Batch request processing
export async function processBatchRequests<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }

    return results;
}

// Performance monitoring for database queries
export function withQueryPerformanceMonitoring<T extends any[], R>(
    queryName: string,
    queryFn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        const startTime = performance.now();

        try {
            const result = await queryFn(...args);
            const duration = performance.now() - startTime;

            if (process.env.NODE_ENV === 'development') {
                console.log(`Query ${queryName} took ${duration.toFixed(2)}ms`);
            }

            // Log slow queries
            if (duration > 1000) {
                console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            console.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    };
}

// API response optimization
export function optimizeApiResponse(data: any): any {
    // Remove null values to reduce payload size
    function removeNulls(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(removeNulls);
        }

        if (typeof obj === 'object' && obj !== null) {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== null && value !== undefined) {
                    cleaned[key] = removeNulls(value);
                }
            }
            return cleaned;
        }

        return obj;
    }

    return removeNulls(data);
}

// Combine all optimizations
export function withApiOptimizations(
    handler: (req: NextRequest) => Promise<NextResponse>,
    options: {
        cache?: { ttl: number };
        rateLimit?: { maxRequests: number; windowMs: number };
        monitoring?: boolean;
    } = {}
) {
    let optimizedHandler = handler;

    if (options.monitoring !== false) {
        optimizedHandler = withApiMonitoring(optimizedHandler);
    }

    if (options.rateLimit) {
        optimizedHandler = withRateLimit(
            optimizedHandler,
            options.rateLimit.maxRequests,
            options.rateLimit.windowMs
        );
    }

    if (options.cache) {
        optimizedHandler = withApiCache(optimizedHandler, options.cache.ttl);
    }

    return optimizedHandler;
}