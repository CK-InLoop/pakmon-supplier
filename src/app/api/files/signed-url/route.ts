import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAzureSignedUrl } from '@/lib/azure-storage';

export async function POST(req: NextRequest) {
  let type: string | undefined;
  let urls: any | undefined;
  let expiresIn = 3600;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    type = body.type;
    urls = body.urls;
    expiresIn = body.additionalExpiresIn || body.expiresIn || 3600;

    if (!type || !urls) {
      return NextResponse.json(
        { error: 'Type and urls are required' },
        { status: 400 }
      );
    }

    let signedUrls: string[] = [];

    // Azure Signed URLs: Append the SAS token to the blob URLs
    if (type === 'images' || type === 'pdfs') {
      if (Array.isArray(urls)) {
        signedUrls = urls.map(url => getAzureSignedUrl(url));
      } else {
        signedUrls = [getAzureSignedUrl(urls)];
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

  } catch (error: any) {
    console.warn('Signed URL generation failed. Returning original URLs as fallback:', error.message);
    return NextResponse.json({
      signedUrls: Array.isArray(urls) ? urls : urls ? [urls] : [],
      expiresIn,
      type,
      fallbacked: true
    });
  }
}
