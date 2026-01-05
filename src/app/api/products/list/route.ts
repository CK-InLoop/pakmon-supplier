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

    let targetSupplierId = supplierId;

    if (!targetSupplierId) {
      // Get the supplier profile for this user
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
      targetSupplierId = supplier.id;
    }

    const products = await prisma.products.findMany({
      where: {
        supplierId: targetSupplierId,
      },
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


