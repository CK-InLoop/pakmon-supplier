import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, get the supplier profile for this user
    const supplier = await prisma.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Get all products for this supplier
    const products = await prisma.product.findMany({
      where: {
        supplierId: supplier.id,
      },
      select: {
        id: true,
        title: true,
        matchCount: true,
        viewCount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        matchCount: 'desc',
      },
    });

    // Calculate summary statistics
    const totalProducts = products.length;
    const approvedProducts = products.filter(p => p.status === 'APPROVED').length;
    const pendingProducts = products.filter(p => p.status === 'PENDING').length;
    const rejectedProducts = products.filter(p => p.status === 'REJECTED').length;
    const totalMatches = products.reduce((sum, p) => sum + p.matchCount, 0);
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);

    return NextResponse.json({
      summary: {
        totalProducts,
        approvedProducts,
        pendingProducts,
        rejectedProducts,
        totalMatches,
        totalViews,
      },
      products,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching analytics' },
      { status: 500 }
    );
  }
}

