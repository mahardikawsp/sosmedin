import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/users/me/avatar
 * Upload profile picture for current user
 */
export async function POST(request: NextRequest) {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${currentUserId}_${timestamp}.${extension}`;
        const filepath = join(uploadsDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        console.log(`Avatar uploaded successfully: ${filepath}`);

        // Update user's profile image URL
        const profileImageUrl = `/uploads/avatars/${filename}`;
        const updatedUser = await prisma.user.update({
            where: { id: currentUserId },
            data: { profileImageUrl },
            select: {
                id: true,
                username: true,
                displayName: true,
                profileImageUrl: true,
            },
        });

        console.log(`Profile image URL updated: ${profileImageUrl}`);

        return NextResponse.json({
            message: 'Profile picture updated successfully',
            user: updatedUser,
            profileImageUrl,
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return NextResponse.json(
            { error: 'Failed to upload profile picture' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/me/avatar
 * Remove profile picture for current user
 */
export async function DELETE() {
    try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update user's profile image URL to null
        const updatedUser = await prisma.user.update({
            where: { id: currentUserId },
            data: { profileImageUrl: null },
            select: {
                id: true,
                username: true,
                displayName: true,
                profileImageUrl: true,
            },
        });

        return NextResponse.json({
            message: 'Profile picture removed successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        return NextResponse.json(
            { error: 'Failed to remove profile picture' },
            { status: 500 }
        );
    }
}