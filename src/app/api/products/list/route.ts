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
      const isDefaultUser = session?.user?.email === 'admin@example.com';

      if (isDefaultUser) {
        targetSupplierId = 'default-supplier-id';
      } else {
        // First, get the supplier profile for this user
        try {
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
        } catch (dbError) {
          console.warn('Database failed while looking up supplier for product list:', dbError);
          return NextResponse.json(
            { error: 'Database connection failed. Please ensure MongoDB is running.' },
            { status: 500 }
          );
        }
      }
    }

    // --- MOCK STORAGE (In-Memory) ---
    const globalForMock = global as unknown as { mockProducts: any[] };
    if (!globalForMock.mockProducts) {
      globalForMock.mockProducts = [];
    }

    const isDefaultUser = session?.user?.email === 'admin@example.com';

    try {
      const products = await prisma.products.findMany({
        where: {
          supplierId: targetSupplierId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter in-memory products for this supplier too if needed
      const mergedProducts = [...products, ...(globalForMock.mockProducts.filter(p => p.supplierId === targetSupplierId))];
      // Sort merged by date
      mergedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ products: mergedProducts });
    } catch (dbError) {
      console.warn('Database failed while fetching products, returning mock data:', dbError);
      const supplierProducts = globalForMock.mockProducts.filter(p => p.supplierId === targetSupplierId || (isDefaultUser && p.supplierId === 'default-supplier-id'));
      return NextResponse.json({ products: supplierProducts });
    }
  } catch (error) {
    console.error('List products error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching products' },
      { status: 500 }
    );
  }
}


