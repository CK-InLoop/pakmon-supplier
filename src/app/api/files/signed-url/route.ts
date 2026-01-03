import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getImageUrl, getPdfUrl, getImageUrls, getPdfUrls } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, urls, expiresIn = 3600 } = body;

    if (!type || !urls) {
      return NextResponse.json(
        { error: 'Type and urls are required' },
        { status: 400 }
      );
    }

    let signedUrls: string[] = [];

    if (type === 'images') {
      if (Array.isArray(urls)) {
        signedUrls = await getImageUrls(urls, expiresIn);
      } else {
        signedUrls = [await getImageUrl(urls, expiresIn)];
      }
    } else if (type === 'pdfs') {
      if (Array.isArray(urls)) {
        signedUrls = await getPdfUrls(urls, expiresIn);
      } else {
        signedUrls = [await getPdfUrl(urls, expiresIn)];
      }
    } else {
      return NextResponse.json(
        { error: 'Type must be "images" or "pdfs"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      signedUrls,
      expiresIn,
      type
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URLs' },
      { status: 500 }
    );
  }
}

