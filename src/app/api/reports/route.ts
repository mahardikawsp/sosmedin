import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for report creation
const createReportSchema = z.object({
    type: z.enum(['post', 'user']),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
    description: z.string().optional(),
    reportedPostId: z.string().optional(),
    reportedUserId: z.string().optional(),
}).refine((data) => {
    // Ensure either reportedPostId or reportedUserId is provided based on type
    if (data.type === 'post') {
        return !!data.reportedPostId;
    }
    if (data.type === 'user') {
        return !!data.reportedUserId;
    }
    return false;
}, {
    message: "Must provide reportedPostId for post reports or reportedUserId for user reports"
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = createReportSchema.parse(body);

        // Check if the content being reported exists
        if (validatedData.type === 'post' && validatedData.reportedPostId) {
            const post = await prisma.post.findUnique({
                where: { id: validatedData.reportedPostId }
            });

            if (!post) {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Post not found' } },
                    { status: 404 }
                );
            }
        }

        if (validatedData.type === 'user' && validatedData.reportedUserId) {
            const user = await prisma.user.findUnique({
                where: { id: validatedData.reportedUserId }
            });

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'User not found' } },
                    { status: 404 }
                );
            }

            // Prevent users from reporting themselves
            if (user.id === session.user.id) {
                return NextResponse.json(
                    { error: { code: 'INVALID_REQUEST', message: 'Cannot report yourself' } },
                    { status: 400 }
                );
            }
        }

        // Check if user has already reported this content
        const existingReport = await prisma.report.findFirst({
            where: {
                reporterId: session.user.id,
                ...(validatedData.reportedPostId && { reportedPostId: validatedData.reportedPostId }),
                ...(validatedData.reportedUserId && { reportedUserId: validatedData.reportedUserId }),
            }
        });

        if (existingReport) {
            return NextResponse.json(
                { error: { code: 'ALREADY_REPORTED', message: 'You have already reported this content' } },
                { status: 409 }
            );
        }

        // Create the report
        const report = await prisma.report.create({
            data: {
                type: validatedData.type,
                reason: validatedData.reason,
                description: validatedData.description,
                reporterId: session.user.id,
                reportedPostId: validatedData.reportedPostId,
                reportedUserId: validatedData.reportedUserId,
            },
            include: {
                reporter: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    }
                },
                reportedPost: validatedData.reportedPostId ? {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                displayName: true,
                            }
                        }
                    }
                } : undefined,
                reportedUser: validatedData.reportedUserId ? {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    }
                } : undefined,
            }
        });

        return NextResponse.json({ report }, { status: 201 });

    } catch (error) {
        console.error('Error creating report:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid request data',
                        details: error.issues
                    }
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create report' } },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const status = searchParams.get('status') || undefined;
        const type = searchParams.get('type') || undefined;
        const forModeration = searchParams.get('moderation') === 'true';

        const skip = (page - 1) * limit;

        // For moderation dashboard, show all reports
        // For regular users, show only their reports
        const whereClause = forModeration ? {
            ...(status && { status }),
            ...(type && { type }),
        } : {
            reporterId: session.user.id,
            ...(status && { status }),
            ...(type && { type }),
        };

        const reports = await prisma.report.findMany({
            where: whereClause,
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
                    }
                },
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit,
        });

        const totalReports = await prisma.report.count({
            where: whereClause
        });

        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total: totalReports,
                pages: Math.ceil(totalReports / limit),
            }
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reports' } },
            { status: 500 }
        );
    }
}