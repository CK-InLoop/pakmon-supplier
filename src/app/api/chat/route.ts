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
    const { query, response, productIds, sessionId } = body;

    if (!query || !response) {
      return NextResponse.json(
        { error: 'Query and response are required' },
        { status: 400 }
      );
    }

    // Create chat record with messages array
    const chat = await prisma.chats.create({
      data: {
        userId: session.user.id,
        sessionId: sessionId || undefined,
        messages: [
          { role: 'user', content: query },
          { role: 'assistant', content: response }
        ],
      },
    });

    // Create product references if provided
    if (productIds && productIds.length > 0) {
      await prisma.chat_product_references.createMany({
        data: productIds.map((productId: string) => ({
          chatId: chat.id,
          productId,
          recommended: true,
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

    const chats = await prisma.chats.findMany({
      where: {
        userId: session.user.id,
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
