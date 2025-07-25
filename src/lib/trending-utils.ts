/**
 * Utility functions for calculating trending content
 */

export interface TrendingScore {
    score: number;
    likes: number;
    replies: number;
    ageHours: number;
}

/**
 * Calculate trending score for a post
 * This is a simple algorithm that considers likes, replies, and recency
 * In production, you'd want a more sophisticated algorithm
 */
export function calculateTrendingScore(
    likes: number,
    replies: number,
    createdAt: Date
): TrendingScore {
    const now = new Date();
    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Engagement score (likes are worth 1 point, replies are worth 2 points)
    const engagementScore = likes + (replies * 2);

    // Time decay factor - posts lose relevance over time
    // After 24 hours, score is halved. After 48 hours, it's quartered, etc.
    const timeDecayFactor = Math.pow(0.5, ageHours / 24);

    // Final score
    const score = engagementScore * timeDecayFactor;

    return {
        score,
        likes,
        replies,
        ageHours,
    };
}

/**
 * Get trending posts query parameters for Prisma
 */
export function getTrendingPostsQuery(hoursBack: number = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);

    return {
        where: {
            parentId: null, // Only top-level posts
            createdAt: {
                gte: cutoffDate,
            },
        },
        orderBy: [
            // This is a simplified ordering - in production you'd calculate the score in the database
            { likes: { _count: 'desc' } },
            { replies: { _count: 'desc' } },
            { createdAt: 'desc' },
        ],
    };
}

/**
 * Sort posts by trending score (client-side)
 * Use this when you need to sort a small number of posts
 */
export function sortPostsByTrending<T extends {
    _count: { likes: number; replies: number };
    createdAt: string | Date;
}>(posts: T[]): T[] {
    return posts.sort((a, b) => {
        const scoreA = calculateTrendingScore(
            a._count.likes,
            a._count.replies,
            new Date(a.createdAt)
        );
        const scoreB = calculateTrendingScore(
            b._count.likes,
            b._count.replies,
            new Date(b.createdAt)
        );

        return scoreB.score - scoreA.score;
    });
}

/**
 * Get suggested users based on follower count and recent activity
 */
export function getSuggestedUsersQuery(excludeUserIds: string[], limit: number = 5) {
    return {
        where: {
            id: {
                notIn: excludeUserIds,
            },
        },
        select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            profileImageUrl: true,
            _count: {
                select: {
                    posts: true,
                    followedBy: true,
                    following: true,
                },
            },
        },
        orderBy: [
            // Order by follower count and recent activity
            { followedBy: { _count: 'desc' } },
            { posts: { _count: 'desc' } },
            { createdAt: 'desc' },
        ],
        take: limit,
    };
}