import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface NotificationSettings {
    likes: boolean;
    follows: boolean;
    replies: boolean;
}

/**
 * GET /api/notifications/settings
 * Get notification settings for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Get user with notification settings
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notificationSettings: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: { code: 'NOT_FOUND', message: 'User not found' } },
                { status: 404 }
            );
        }

        // Parse notification settings or use defaults
        const defaultSettings: NotificationSettings = {
            likes: true,
            follows: true,
            replies: true,
        };

        const settings: NotificationSettings = user.notificationSettings
            ? (user.notificationSettings as unknown as NotificationSettings)
            : defaultSettings;

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notification settings' } },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/notifications/settings
 * Update notification settings for the authenticated user
 */
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { settings } = body;

        // Validate settings structure
        if (!settings || typeof settings !== 'object') {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'Settings object is required' } },
                { status: 400 }
            );
        }

        // Validate individual settings
        const validKeys = ['likes', 'follows', 'replies'];
        const settingsKeys = Object.keys(settings);

        if (!settingsKeys.every(key => validKeys.includes(key))) {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'Invalid settings keys. Valid keys are: likes, follows, replies' } },
                { status: 400 }
            );
        }

        if (!settingsKeys.every(key => typeof settings[key] === 'boolean')) {
            return NextResponse.json(
                { error: { code: 'INVALID_PARAMS', message: 'All settings values must be boolean' } },
                { status: 400 }
            );
        }

        // Update user notification settings
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { notificationSettings: settings },
            select: { notificationSettings: true },
        });

        return NextResponse.json({
            settings: updatedUser.notificationSettings as unknown as NotificationSettings,
            message: 'Notification settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update notification settings' } },
            { status: 500 }
        );
    }
}