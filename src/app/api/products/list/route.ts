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

import { mockStore } from '@/lib/mock-store';

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
    const isDefaultUser = session?.user?.email === 'admin@example.com';

    let targetSupplierId = supplierId;

    if (!targetSupplierId) {
      if (isDefaultUser) {
        targetSupplierId = 'mock-supplier-1';
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
          // Fallback for default user or return error
          if (isDefaultUser) {
            targetSupplierId = 'mock-supplier-1';
          } else {
            return NextResponse.json(
              { error: 'Database connection failed. Please ensure MongoDB is running.' },
              { status: 500 }
            );
          }
        }
      }
    }

    try {
      const products = await prisma.products.findMany({
        where: {
          supplierId: targetSupplierId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Filter in-memory products for this supplier strictly
      const mockProducts = mockStore.products.filter(p => p.supplierId === targetSupplierId);
      const mergedProducts = [...products, ...mockProducts];

      // Sort merged by date
      mergedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({ products: mergedProducts });
    } catch (dbError) {
      console.warn('Database failed while fetching products, returning mock data:', dbError);
      // Strictly filter mock products for this supplier
      const supplierProducts = mockStore.products.filter(p => p.supplierId === targetSupplierId);
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


