import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToAzure } from '@/lib/azure-storage';
import { createProductChunks, ingestToAutoRAG } from '@/lib/autorag';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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

    const title = formData.get('title') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const fullDescription = formData.get('fullDescription') as string;
    const specifications = formData.get('specifications') as string | null;
    const category = formData.get('category') as string;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];
    const priceRange = formData.get('priceRange') as string | null;
    const capacity = formData.get('capacity') as string | null;
    const youtubeUrl = formData.get('youtubeUrl') as string | null;
    const providedSupplierId = formData.get('supplierId') as string | null;

    // Validation
    if (!title || !shortDescription || !fullDescription) {
      return NextResponse.json(
        { error: 'Title, short description, and full description are required' },
        { status: 400 }
      );
    }

    // Check for pre-uploaded URLs first (new flow)
    const imageUrlsJson = formData.get('imageUrls') as string | null;
    const fileUrlsJson = formData.get('fileUrls') as string | null;

    let imageUrls: string[] = [];
    let fileUrls: string[] = [];

    if (imageUrlsJson) {
      try {
        imageUrls = JSON.parse(imageUrlsJson);
      } catch (e) {
        console.error('Error parsing imageUrls:', e);
      }
    }

    if (fileUrlsJson) {
      try {
        fileUrls = JSON.parse(fileUrlsJson);
      } catch (e) {
        console.error('Error parsing fileUrls:', e);
      }
    }

    // Legacy support: Upload images if files are provided instead of URLs
    const images = formData.getAll('images') as File[];
    for (const image of images) {
      if (image.size > 0) {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const url = await uploadToAzure(buffer, image.name, image.type, session.user.id, 'new');
          imageUrls.push(url);
        } catch (error: any) {
          console.error('Azure image upload error:', error);
          return NextResponse.json(
            {
              error: 'Failed to upload image to Azure. ' + error.message,
            },
            { status: 500 }
          );
        }
      }
    }

    // Legacy support: Upload PDF files if files are provided instead of URLs
    const files = formData.getAll('files') as File[];
    for (const file of files) {
      if (file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const url = await uploadToAzure(buffer, file.name, file.type, session.user.id, 'new');
          fileUrls.push(url);
        } catch (error: any) {
          console.error('Azure file upload error:', error);
          return NextResponse.json(
            {
              error: 'Failed to upload file to Azure. ' + error.message,
            },
            { status: 500 }
          );
        }
      }
    }

    const isDefaultUser = session?.user?.email === 'admin@example.com';

    // First, get the supplier profile for this user
    let supplier;
    if (providedSupplierId) {
      // If supplierId is provided, we use it (useful for admins managing others)
      supplier = await prisma.suppliers.findUnique({
        where: { id: providedSupplierId },
      });
    } else {
      // Find supplier linked to session user
      supplier = await prisma.suppliers.findFirst({
        where: { userId: session.user.id },
      });
    }

    if (!supplier) {
      // Check if it's the mock admin and we have a mock ID we can use for DB lookups?
      // Actually, if we're moving to REAL APIs, the user MUST have a supplier profile.
      return NextResponse.json(
        {
          error: 'Supplier profile not found. Please contact an administrator.',
          redirect: '/login'
        },
        { status: 404 }
      );
    }

    // Create product in database
    const product = await prisma.products.create({
      data: {
        supplierId: supplier.id,
        name: title,
        title,
        shortDescription,
        fullDescription,
        description: shortDescription,
        specifications,
        images: imageUrls,
        pdfFiles: fileUrls,
        youtubeUrl: youtubeUrl || undefined,
        priceRange: priceRange || undefined,
        capacity: capacity || undefined,
        category,
        tags,

      },
    });

    // Create chunks and ingest to AutoRAG
    try {
      const chunks = await createProductChunks(product);
      await ingestToAutoRAG(chunks);
    } catch (error) {
      console.error('AutoRAG ingestion error:', error);
    }

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add product error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the product' },
      { status: 500 }
    );
  }
}


