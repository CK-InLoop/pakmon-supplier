import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let formData: FormData;
        try {
            formData = await req.formData();
        } catch (error) {
            console.error('FormData parsing error:', error);
            return NextResponse.json(
                { error: 'Invalid form data' },
                { status: 400 }
            );
        }

        const file = formData.get('file') as File;
        const type = formData.get('type') as string; // 'image' or 'pdf'

        if (!file || file.size === 0) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (type === 'image' && !file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Invalid image file' },
                { status: 400 }
            );
        }

        if (type === 'pdf' && file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Invalid PDF file' },
                { status: 400 }
            );
        }

        // Check file size (max 10MB for images, 50MB for PDFs)
        const maxSize = type === 'pdf' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: `File too large. Max size: ${type === 'pdf' ? '50MB' : '10MB'}` },
                { status: 400 }
            );
        }

        // Upload to R2
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(buffer, file.name, file.type, session.user.id, 'new');

        return NextResponse.json({
            success: true,
            url,
            filename: file.name,
            size: file.size,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
