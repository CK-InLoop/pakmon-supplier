import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const hasMatches = searchParams.get('hasMatches') === 'true';

    const where: any = {};
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Apply additional filters
    if (status) {
      where.status = status.toUpperCase();
    }
    if (hasMatches) {
      where.matchCount = { gt: 0 };
    }

    const products = await prisma.products.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('List products error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching products' },
      { status: 500 }
    );
  }
}


