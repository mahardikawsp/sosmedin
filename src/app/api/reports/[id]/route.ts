import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        const report = await prisma.report.findUnique({
            where: {
                id: params.id,
            },
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

        if (!report) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'Report not found' } },
                { status: 404 }
            );
        }

        // Only allow the reporter to view their own reports
        // (Admin access will be handled in the moderation dashboard)
        if (report.reporterId !== session.user.id) {
            return NextResponse.json(
                { error: { code: 'FORBIDDEN', message: 'Access denied' } },
                { status: 403 }
            );
        }

        return NextResponse.json({ report });

    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch report' } },
            { status: 500 }
        );
    }
}