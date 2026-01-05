import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToAzure, deleteFromAzure } from '@/lib/azure-storage';
import { createProductChunks, ingestToAutoRAG, deleteFromAutoRAG } from '@/lib/autorag';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First, get the supplier profile for this user
    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    const product = await prisma.products.findFirst({
      where: {
        id,
        supplierId: supplier.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching the product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const specs = formData.get('specs') as string | null;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];
    const youtubeUrl = formData.get('youtubeUrl') as string | null;

    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    const existingProduct = await prisma.products.findFirst({
      where: {
        id,
        supplierId: supplier.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let images = [...existingProduct.images];
    const newImages = formData.getAll('newImages') as File[];
    for (const image of newImages) {
      if (image.size > 0) {
        try {
          const buffer = Buffer.from(await image.arrayBuffer());
          const url = await uploadToAzure(buffer, image.name, image.type, session.user.id, id);
          images.push(url);
        } catch (e: any) {
          console.error('Azure upload failed in PATCH:', e.message);
          return NextResponse.json(
            { error: `Failed to upload image to Azure: ${e.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Handle image deletions
    const deletedImages = formData.get('deletedImages') as string;
    if (deletedImages) {
      const imagesToDelete = deletedImages.split(',');
      for (const imageUrl of imagesToDelete) {
        try {
          await deleteFromAzure(imageUrl);
        } catch (e) {
          console.warn('Azure delete failed:', e);
        }
        images = images.filter(url => url !== imageUrl);
      }
    }

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        title: title || existingProduct.title,
        name: title || existingProduct.name,
        shortDescription: description || existingProduct.shortDescription,
        fullDescription: description || existingProduct.fullDescription,
        description: description || existingProduct.description,
        specifications: specs !== null ? specs : existingProduct.specifications,
        youtubeUrl: youtubeUrl !== null ? (youtubeUrl || null) : existingProduct.youtubeUrl,
        images,
        tags: tags.length > 0 ? tags : existingProduct.tags,
      },
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating the product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    const product = await prisma.products.findFirst({
      where: {
        id,
        supplierId: supplier.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete associated files from Azure
    for (const imageUrl of product.images) {
      try { await deleteFromAzure(imageUrl); } catch (e) { }
    }
    for (const pdfUrl of product.pdfFiles) {
      try { await deleteFromAzure(pdfUrl); } catch (e) { }
    }

    await prisma.products.delete({ where: { id } });

    // Also remove from AutoRAG if possible
    try {
      await deleteFromAutoRAG([id]);
    } catch (e) {
      console.warn('Failed to delete from AutoRAG:', e);
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the product' },
      { status: 500 }
    );
  }
}


