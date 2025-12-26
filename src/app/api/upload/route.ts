import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Increase timeout for file uploads (5 minutes)
export const maxDuration = 300;

// Retry helper function with exponential backoff
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.log(`Upload attempt ${attempt}/${maxRetries} failed:`, error.message);

            // Don't retry on certain errors
            if (error.message?.includes('Unauthorized') ||
                error.message?.includes('Invalid') ||
                error.message?.includes('too large')) {
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Upload failed after retries');
}

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

        // Log file details for debugging
        console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

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

        // Convert file to buffer before retry loop (avoid re-reading)
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to R2 with retry logic
        const url = await retryWithBackoff(
            () => uploadToR2(buffer, file.name, file.type, session.user.id, 'new'),
            3, // max 3 retries
            1000 // 1 second initial delay
        );

        console.log(`Upload successful: ${file.name} -> ${url}`);

        return NextResponse.json({
            success: true,
            url,
            filename: file.name,
            size: file.size,
        });
    } catch (error: any) {
        console.error('Upload error:', error);

        // Provide more specific error messages
        let errorMessage = error.message || 'Upload failed';
        let statusCode = 500;

        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            errorMessage = 'Storage access denied. Please try again or contact support.';
            statusCode = 403;
        } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
            errorMessage = 'Upload timed out. Please try again with a smaller file or check your connection.';
            statusCode = 408;
        } else if (error.message?.includes('network') || error.message?.includes('ECONNRESET')) {
            errorMessage = 'Network error during upload. Please check your connection and try again.';
            statusCode = 503;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}
