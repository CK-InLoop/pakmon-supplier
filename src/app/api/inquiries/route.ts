import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { productId, message, contactName, contactEmail, contactPhone } = body;

    if (!productId || !message || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Product ID, message, contact name, and contact email are required' },
        { status: 400 }
      );
    }

    // Get product with supplier info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        supplier: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        productId,
        supplierId: product.supplierId,
        message,
        contactName,
        contactEmail,
        contactPhone,
      },
    });

    return NextResponse.json({
      message: 'Inquiry sent successfully',
      inquiry,
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const inquiries = await prisma.inquiry.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: true,
        supplier: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching inquiries' },
      { status: 500 }
    );
  }
}
