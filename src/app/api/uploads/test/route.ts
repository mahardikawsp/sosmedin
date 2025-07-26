import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
    try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
        const dirExists = existsSync(uploadsDir);

        return NextResponse.json({
            message: 'Upload directory check',
            uploadsDir,
            dirExists,
            cwd: process.cwd(),
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to check upload directory',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}