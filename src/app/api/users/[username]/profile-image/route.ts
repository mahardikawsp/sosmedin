import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/users/[username]/profile-image
 * Upload a profile image for a user
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        const { username } = params;

        // Get current user ID
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if the current user is the owner of this profile
        if (user.id !== currentUserId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse the form data
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(imageFile.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported types: JPEG, PNG, GIF, WebP' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds the 5MB limit' },
                { status: 400 }
            );
        }

        // In a real implementation, we would upload the image to a cloud storage service
        // For now, we'll simulate this by generating a fake URL
        // In production, replace this with actual cloud storage upload logic

        // Read the file as an ArrayBuffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `${user.id}_${timestamp}_${imageFile.name.replace(/\s+/g, '_')}`;

        // In a real implementation, this is where you would upload to cloud storage
        // For example, using AWS S3:
        // const s3Result = await uploadToS3(buffer, filename, imageFile.type);
        // const imageUrl = s3Result.Location;

        // For now, we'll use a placeholder URL
        const imageUrl = `https://storage.example.com/profiles/${filename}`;

        // Update the user's profile image URL in the database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                profileImageUrl: imageUrl,
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            message: 'Profile image uploaded successfully',
            profile: updatedUser,
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return NextResponse.json(
            { error: 'Failed to upload profile image' },
            { status: 500 }
        );
    }
}