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

    // Validation
    if (!title || !shortDescription || !fullDescription) {
      return NextResponse.json(
        { error: 'Title, short description, and full description are required' },
        { status: 400 }
      );
    }

    // Upload images
    const imageUrls: string[] = [];
    const images = formData.getAll('images') as File[];

    for (const image of images) {
      if (image.size > 0) {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const url = await uploadToR2(buffer, image.name, image.type);
          imageUrls.push(url);
        } catch (error: any) {
          console.error('Image upload error:', error);
          return NextResponse.json(
            {
              error: 'Failed to upload image. ' + error.message,
              details: 'Please check your R2 configuration. See ENVIRONMENT_SETUP.md for instructions.'
            },
            { status: 500 }
          );
        }
      }
    }

    // Upload PDF files
    const fileUrls: string[] = [];
    const files = formData.getAll('files') as File[];

    for (const file of files) {
      if (file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const url = await uploadToR2(buffer, file.name, file.type);
          fileUrls.push(url);
        } catch (error: any) {
          console.error('File upload error:', error);
          return NextResponse.json(
            {
              error: 'Failed to upload file. ' + error.message,
              details: 'Please check your R2 configuration. See ENVIRONMENT_SETUP.md for instructions.'
            },
            { status: 500 }
          );
        }
      }
    }

    // First, get the supplier profile for this user
    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          error: 'Supplier profile not found. Please complete onboarding first.',
          redirect: '/onboarding'
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
        description: shortDescription, // Use shortDescription as primary description
        specifications,
        images: imageUrls,
        pdfFiles: fileUrls,
        category,
        tags,
        status: 'PENDING',
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

