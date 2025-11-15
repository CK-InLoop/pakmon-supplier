import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { createProductChunks, ingestToAutoRAG, deleteFromAutoRAG } from '@/lib/autorag';

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
    const supplier = await prisma.supplier.findUnique({
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

    const product = await prisma.product.findFirst({
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
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the product' },
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

    // First, get the supplier profile for this user
    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Check if product exists and belongs to the supplier
    const existingProduct = await prisma.product.findFirst({
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

    const formData = await req.formData();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const specs = formData.get('specs') as string | null;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];

    // Handle new image uploads
    let images = [...existingProduct.images];
    const newImages = formData.getAll('newImages') as File[];
    
    for (const image of newImages) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadToR2(buffer, image.name, image.type);
        images.push(url);
      }
    }

    // Handle image deletions
    const deletedImages = formData.get('deletedImages') as string;
    if (deletedImages) {
      const imagesToDelete = deletedImages.split(',');
      for (const imageUrl of imagesToDelete) {
        await deleteFromR2(imageUrl);
        images = images.filter(url => url !== imageUrl);
      }
    }

    // Handle new file uploads
    let pdfFiles = [...existingProduct.pdfFiles];
    const newFiles = formData.getAll('newFiles') as File[];
    
    for (const file of newFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(buffer, file.name, file.type);
        pdfFiles.push(url);
      }
    }

    // Handle file deletions
    const deletedFiles = formData.get('deletedFiles') as string;
    if (deletedFiles) {
      const filesToDelete = deletedFiles.split(',');
      for (const fileUrl of filesToDelete) {
        await deleteFromR2(fileUrl);
        pdfFiles = pdfFiles.filter(url => url !== fileUrl);
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: title || existingProduct.title,
        shortDescription: description || existingProduct.shortDescription,
        fullDescription: description || existingProduct.fullDescription,
        specifications: specs !== null ? specs : existingProduct.specifications,
        tags: tags.length > 0 ? tags : existingProduct.tags,
        images,
        pdfFiles,
      },
    });

    // Re-ingest to AutoRAG
    try {
      // Delete old chunks
      const oldChunks = await createProductChunks(existingProduct);
      await deleteFromAutoRAG(oldChunks.map(c => c.id));
      
      // Create new chunks
      const newChunks = await createProductChunks(updatedProduct);
      await ingestToAutoRAG(newChunks);
    } catch (error) {
      console.error('AutoRAG re-ingestion error:', error);
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the product' },
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

    // First, get the supplier profile for this user
    const supplier = await prisma.supplier.findUnique({
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        supplierId: supplier.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete files from R2 (continue even if some fail)
    const deleteErrors: string[] = [];
    
    if (product.images && Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        if (imageUrl) {
          try {
            await deleteFromR2(imageUrl);
          } catch (error) {
            console.error('Error deleting image from R2:', imageUrl, error);
            deleteErrors.push(`Failed to delete image: ${imageUrl}`);
          }
        }
      }
    }

    if (product.pdfFiles && Array.isArray(product.pdfFiles)) {
      for (const fileUrl of product.pdfFiles) {
        if (fileUrl) {
          try {
            await deleteFromR2(fileUrl);
          } catch (error) {
            console.error('Error deleting PDF from R2:', fileUrl, error);
            deleteErrors.push(`Failed to delete PDF: ${fileUrl}`);
          }
        }
      }
    }

    // Delete from AutoRAG (continue even if it fails)
    try {
      const chunks = await createProductChunks(product);
      if (chunks.length > 0) {
        await deleteFromAutoRAG(chunks.map(c => c.id));
      }
    } catch (error) {
      console.error('AutoRAG deletion error:', error);
      // Don't fail the entire operation if AutoRAG deletion fails
    }

    // Delete product from database
    try {
      await prisma.product.delete({
        where: { id },
      });
    } catch (error: any) {
      // If product was already deleted or doesn't exist, that's okay
      if (error.code === 'P2025') {
        console.warn('Product already deleted:', id);
      } else {
        throw error;
      }
    }

    // Return success even if some file deletions failed (product is deleted from DB)
    return NextResponse.json({
      message: 'Product deleted successfully',
      warnings: deleteErrors.length > 0 ? deleteErrors : undefined,
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting the product' },
      { status: 500 }
    );
  }
}

