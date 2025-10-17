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
    const { query, response, productIds } = body;

    if (!query || !response) {
      return NextResponse.json(
        { error: 'Query and response are required' },
        { status: 400 }
      );
    }

    // Create chat record
    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        query,
        response,
      },
    });

    // Create product references if provided
    if (productIds && productIds.length > 0) {
      await prisma.chatProductReference.createMany({
        data: productIds.map((productId: string, index: number) => ({
          chatId: chat.id,
          productId,
          relevanceScore: 1.0 - (index * 0.1), // Simple scoring based on order
        })),
      });
    }

    return NextResponse.json({
      message: 'Chat saved successfully',
      chat,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'An error occurred while saving chat' },
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

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching chats' },
      { status: 500 }
    );
  }
}
