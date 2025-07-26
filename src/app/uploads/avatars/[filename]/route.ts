import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = params;

        // Validate filename to prevent directory traversal
        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        // Construct file path
        const filePath = join(process.cwd(), 'public', 'uploads', 'avatars', filename);

        // Check if file exists
        if (!existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        // Read file
        const fileBuffer = await readFile(filePath);

        // Determine content type based on file extension
        const extension = filename.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';

        switch (extension) {
            case 'jpg':
            case 'jpeg':
                contentType = 'image/jpeg';
                break;
            case 'png':
                contentType = 'image/png';
                break;
            case 'webp':
                contentType = 'image/webp';
                break;
            case 'gif':
                contentType = 'image/gif';
                break;
        }

        // Return file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error serving avatar image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}