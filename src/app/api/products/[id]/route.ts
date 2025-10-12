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

    const product = await prisma.product.findFirst({
      where: {
        id,
        supplierId: session.user.id,
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

    // Check if product exists and belongs to the user
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        supplierId: session.user.id,
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
    let imageUrls = [...existingProduct.imageUrls];
    const newImages = formData.getAll('newImages') as File[];
    
    for (const image of newImages) {
      if (image.size > 0) {
        const buffer = Buffer.from(await image.arrayBuffer());
        const url = await uploadToR2(buffer, image.name, image.type);
        imageUrls.push(url);
      }
    }

    // Handle image deletions
    const deletedImages = formData.get('deletedImages') as string;
    if (deletedImages) {
      const imagesToDelete = deletedImages.split(',');
      for (const imageUrl of imagesToDelete) {
        await deleteFromR2(imageUrl);
        imageUrls = imageUrls.filter(url => url !== imageUrl);
      }
    }

    // Handle new file uploads
    let fileUrls = [...existingProduct.fileUrls];
    const newFiles = formData.getAll('newFiles') as File[];
    
    for (const file of newFiles) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadToR2(buffer, file.name, file.type);
        fileUrls.push(url);
      }
    }

    // Handle file deletions
    const deletedFiles = formData.get('deletedFiles') as string;
    if (deletedFiles) {
      const filesToDelete = deletedFiles.split(',');
      for (const fileUrl of filesToDelete) {
        await deleteFromR2(fileUrl);
        fileUrls = fileUrls.filter(url => url !== fileUrl);
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: title || existingProduct.title,
        description: description || existingProduct.description,
        specs: specs !== null ? specs : existingProduct.specs,
        tags: tags.length > 0 ? tags : existingProduct.tags,
        imageUrls,
        fileUrls,
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        supplierId: session.user.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete files from R2
    for (const imageUrl of product.imageUrls) {
      try {
        await deleteFromR2(imageUrl);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    for (const fileUrl of product.fileUrls) {
      try {
        await deleteFromR2(fileUrl);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete from AutoRAG
    try {
      const chunks = await createProductChunks(product);
      await deleteFromAutoRAG(chunks.map(c => c.id));
    } catch (error) {
      console.error('AutoRAG deletion error:', error);
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting the product' },
      { status: 500 }
    );
  }
}

