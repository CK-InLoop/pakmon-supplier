import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
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
        {
          error: 'Supplier profile not found. Please complete onboarding first.',
          redirect: '/onboarding'
        },
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
    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Check if product exists and belongs to the supplier
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

    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const specs = formData.get('specs') as string | null;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : [];
    const youtubeUrl = formData.get('youtubeUrl') as string | null;

    // Handle new image uploads
    let images = [...existingProduct.images];
    const newImages = formData.getAll('newImages') as File[];

    for (const image of newImages) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadToR2(buffer, image.name, image.type, session.user.id, id);
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
        const url = await uploadToR2(buffer, file.name, file.type, session.user.id, id);
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
    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        title: title || existingProduct.title,
        shortDescription: description || existingProduct.shortDescription,
        fullDescription: description || existingProduct.fullDescription,
        specifications: specs !== null ? specs : existingProduct.specifications,
        tags: tags.length > 0 ? tags : existingProduct.tags,
        images,
        pdfFiles,
        youtubeUrl: youtubeUrl !== null ? (youtubeUrl || null) : existingProduct.youtubeUrl,
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

    // Find product and verify ownership
    const product = await prisma.products.findFirst({
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

    console.log('Deleting product:', {
      productId: id,
      supplierId: supplier.id,
      title: product.title,
    });

    const productImages = Array.isArray(product.images) ? [...product.images] : [];
    const productFiles = Array.isArray(product.pdfFiles) ? [...product.pdfFiles] : [];

    // Delete related records first (MongoDB doesn't enforce cascade deletes)
    // Delete likes for this product
    try {
      await prisma.liked.deleteMany({
        where: { productId: id },
      });
      console.log('Deleted likes for product:', id);
    } catch (error) {
      console.error('Error deleting likes:', error);
      // Continue even if this fails
    }

    // Delete chat product references
    try {
      await prisma.chat_product_references.deleteMany({
        where: { productId: id },
      });
      console.log('Deleted chat references for product:', id);
    } catch (error) {
      console.error('Error deleting chat references:', error);
      // Continue even if this fails
    }

    // Delete inquiries for this product
    try {
      await prisma.inquiries.deleteMany({
        where: { productId: id },
      });
      console.log('Deleted inquiries for product:', id);
    } catch (error) {
      console.error('Error deleting inquiries:', error);
      // Continue even if this fails
    }

    // Delete product from database before performing long-running cleanup tasks
    try {
      await prisma.products.delete({
        where: { id },
      });
      console.log('Successfully deleted product from database:', id);
    } catch (error: any) {
      console.error('Error deleting product from database:', error);
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Verify deletion was successful
    const verifyProduct = await prisma.products.findUnique({
      where: { id },
    });

    if (verifyProduct) {
      console.error('Product still exists after delete operation:', id);
      throw new Error('Failed to delete product from database');
    }

    // Delete files from R2 (continue even if some fail)
    const deleteErrors: string[] = [];

    const deleteImageResults = await Promise.allSettled(
      productImages
        .filter((url): url is string => Boolean(url))
        .map(async (imageUrl) => {
          try {
            await deleteFromR2(imageUrl);
          } catch (error) {
            console.error('Error deleting image from R2:', imageUrl, error);
            throw new Error(`Failed to delete image: ${imageUrl}`);
          }
        })
    );

    deleteImageResults.forEach((result) => {
      if (result.status === 'rejected') {
        const reason = result.reason as { message?: string };
        deleteErrors.push(reason?.message || 'Failed to delete an image from R2');
      }
    });

    const deleteFileResults = await Promise.allSettled(
      productFiles
        .filter((url): url is string => Boolean(url))
        .map(async (fileUrl) => {
          try {
            await deleteFromR2(fileUrl);
          } catch (error) {
            console.error('Error deleting PDF from R2:', fileUrl, error);
            throw new Error(`Failed to delete PDF: ${fileUrl}`);
          }
        })
    );

    deleteFileResults.forEach((result) => {
      if (result.status === 'rejected') {
        const reason = result.reason as { message?: string };
        deleteErrors.push(reason?.message || 'Failed to delete a PDF from R2');
      }
    });

    // Delete from AutoRAG (continue even if it fails)
    try {
      const chunks = await createProductChunks(product);
      if (chunks.length > 0) {
        await deleteFromAutoRAG(chunks.map(c => c.id));
        console.log('Deleted AutoRAG chunks for product:', id);
      }
    } catch (error) {
      console.error('AutoRAG deletion error:', error);
      // Don't fail the entire operation if AutoRAG deletion fails
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

