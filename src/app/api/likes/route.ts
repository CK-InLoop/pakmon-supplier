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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.liked.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Product already liked' },
        { status: 400 }
      );
    }

    // Create like
    const like = await prisma.liked.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({
      message: 'Product liked successfully',
      like,
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'An error occurred while liking the product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Remove like (idempotent)
    const result = await prisma.liked.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({
      message: 'Product unliked successfully',
      deleted: result.count,
    });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json(
      { error: 'An error occurred while unliking the product' },
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

    const likes = await prisma.liked.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            supplier: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ likes });
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching likes' },
      { status: 500 }
    );
  }
}

