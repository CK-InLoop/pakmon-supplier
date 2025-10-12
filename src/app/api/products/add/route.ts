import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';
import { createProductChunks, ingestToAutoRAG } from '@/lib/autorag';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const specs = formData.get('specs') as string | null;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Upload images
    const imageUrls: string[] = [];
    const images = formData.getAll('images') as File[];
    
    for (const image of images) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadToR2(buffer, image.name, image.type);
        imageUrls.push(url);
      }
    }

    // Upload PDF files
    const fileUrls: string[] = [];
    const files = formData.getAll('files') as File[];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(buffer, file.name, file.type);
        fileUrls.push(url);
      }
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        supplierId: session.user.id,
        title,
        description,
        specs,
        tags,
        imageUrls,
        fileUrls,
        isApproved: false,
      },
    });

    // Create chunks and ingest to AutoRAG
    try {
      const chunks = await createProductChunks(product);
      await ingestToAutoRAG(chunks);
    } catch (error) {
      console.error('AutoRAG ingestion error:', error);
      // Don't fail the request if ingestion fails
    }

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add product error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the product' },
      { status: 500 }
    );
  }
}

