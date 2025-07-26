import { prisma } from './prisma';

export type ReportType = 'post' | 'user';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface CreateReportData {
    type: ReportType;
    reason: ReportReason;
    description?: string;
    reporterId: string;
    reportedPostId?: string;
    reportedUserId?: string;
}

export interface ReportWithDetails {
    id: string;
    type: ReportType;
    reason: ReportReason;
    description: string | null;
    status: ReportStatus;
    createdAt: Date;
    updatedAt: Date;
    reporter: {
        id: string;
        username: string;
        displayName: string | null;
    };
    reportedPost?: {
        id: string;
        content: string;
        createdAt: Date;
        user: {
            id: string;
            username: string;
            displayName: string | null;
        };
    };
    reportedUser?: {
        id: string;
        username: string;
        displayName: string | null;
        bio: string | null;
        profileImageUrl: string | null;
    };
}

/**
 * Create a new report
 */
export async function createReport(data: CreateReportData): Promise<ReportWithDetails> {
    const report = await prisma.report.create({
        data,
        include: {
            reporter: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                }
            },
            reportedPost: data.reportedPostId ? {
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        }
                    }
                }
            } : undefined,
            reportedUser: data.reportedUserId ? {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    bio: true,
                    profileImageUrl: true,
                }
            } : undefined,
        }
    });

    return report as ReportWithDetails;
}

/**
 * Get reports by user (for user's own reports)
 */
export async function getUserReports(
    userId: string,
    options: {
        page?: number;
        limit?: number;
        status?: ReportStatus;
        type?: ReportType;
    } = {}
): Promise<{ reports: ReportWithDetails[]; total: number }> {
    const { page = 1, limit = 20, status, type } = options;
    const skip = (page - 1) * limit;

    const where = {
        reporterId: userId,
        ...(status && { status }),
        ...(type && { type }),
    };

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where,
            include: {
                reporter: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    }
                },
                reportedPost: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                            }
                        }
                    }
                },
                reportedUser: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        bio: true,
                        profileImageUrl: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit,
        }),
        prisma.report.count({ where })
    ]);

    return { reports: reports as ReportWithDetails[], total };
}

/**
 * Get a specific report by ID
 */
export async function getReportById(reportId: string): Promise<ReportWithDetails | null> {
    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
            reporter: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                }
            },
            reportedPost: {
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        }
                    }
                }
            },
            reportedUser: {
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    bio: true,
                    profileImageUrl: true,
                }
            },
        }
    });

    return report as ReportWithDetails | null;
}

/**
 * Check if a user has already reported specific content
 */
export async function hasUserReported(
    userId: string,
    contentId: string,
    type: ReportType
): Promise<boolean> {
    const where = {
        reporterId: userId,
        ...(type === 'post' ? { reportedPostId: contentId } : { reportedUserId: contentId }),
    };

    const existingReport = await prisma.report.findFirst({ where });
    return !!existingReport;
}

/**
 * Get report statistics for a user
 */
export async function getUserReportStats(userId: string): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
}> {
    const reports = await prisma.report.groupBy({
        by: ['status'],
        where: { reporterId: userId },
        _count: { status: true },
    });

    const stats = {
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
    };

    reports.forEach((report) => {
        const count = report._count.status;
        stats.total += count;
        stats[report.status as ReportStatus] = count;
    });

    return stats;
}

/**
 * Get the reason display text
 */
export function getReasonDisplayText(reason: ReportReason): string {
    const reasonMap: Record<ReportReason, string> = {
        spam: 'Spam',
        harassment: 'Harassment',
        inappropriate: 'Inappropriate Content',
        other: 'Other',
    };

    return reasonMap[reason] || reason;
}

/**
 * Get the status display text
 */
export function getStatusDisplayText(status: ReportStatus): string {
    const statusMap: Record<ReportStatus, string> = {
        pending: 'Pending Review',
        reviewed: 'Under Review',
        resolved: 'Resolved',
        dismissed: 'Dismissed',
    };

    return statusMap[status] || status;
}