import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getAdminOverview() {
  const [
    totalSuppliers,
    approvedSuppliers,
    pendingSuppliers,
    totalProducts,
    approvedProducts,
    pendingProducts,
    rejectedProducts,
    totalInquiries,
    resolvedInquiries,
    productStats,
    topSuppliersRaw,
    recentSuppliers,
    recentProducts,
  ] = await Promise.all([
    prisma.suppliers.count(),
        // Removed approved/pending counts as per 2026-01-07 request. Restore if needed.
        // prisma.suppliers.count({ where: { status: 'APPROVED' } }),
        // prisma.suppliers.count({ where: { status: 'PENDING' } }),
        // prisma.products.count({ where: { status: 'APPROVED' } }),
        // prisma.products.count({ where: { status: 'PENDING' } }),
    prisma.products.count({ where: { status: 'PENDING' } }),
    prisma.products.count({ where: { status: 'REJECTED' } }),
    prisma.inquiries.count(),
    prisma.inquiries.count({ where: { status: 'responded' } }),
    prisma.products.aggregate({
      _sum: { recommendations: true, views: true },
    }),
    prisma.suppliers.findMany({
      take: 5,
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: { products: true, inquiries: true },
        },
        products: {
          select: { recommendations: true, views: true, status: true },
        },
      },
    }),
    prisma.suppliers.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        companyName: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.products.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        supplier: {
          select: { companyName: true },
        },
      },
    }),
  ]);

  const totalMatches = productStats._sum.recommendations ?? 0;
  const totalViews = productStats._sum.views ?? 0;

  const topSuppliers = topSuppliersRaw.map((supplier) => {
    const approvedProductCount = supplier.products.filter(
      (p) => p.status === 'APPROVED'
    ).length;
    const totalSupplierMatches = supplier.products.reduce(
      (sum, p) => sum + (p.recommendations || 0),
      0
    );
    const totalSupplierViews = supplier.products.reduce(
      (sum, p) => sum + (p.views || 0),
      0
    );

    return {
      id: supplier.id,
      companyName: supplier.companyName,
      status: supplier.status,
      contactName: supplier.name,
      contactEmail: supplier.email,
          // approvedProducts: approvedProductCount, // Removed as per 2026-01-07 request
      approvedProducts: approvedProductCount,
          // totalMatches: totalSupplierMatches, // Removed as per 2026-01-07 request
      totalViews: totalSupplierViews,
      inquiries: supplier._count.inquiries,
    };
  });

  return {
    scope: 'overview',
    summary: {
      suppliers: {
        total: totalSuppliers,
        approved: approvedSuppliers,
            // pending: pendingSuppliers, // Removed as per 2026-01-07 request
      },
      products: {
        total: totalProducts,
            // approved: approvedProducts, // Removed as per 2026-01-07 request
            // pending: pendingProducts, // Removed as per 2026-01-07 request
        rejected: rejectedProducts,
      },
      inquiries: {
        total: totalInquiries,
        responded: resolvedInquiries,
      },
      engagements: {
        totalMatches,
        totalViews,
      },
    },
    topSuppliers,
    recentActivity: {
      suppliers: recentSuppliers,
      products: recentProducts,
    },
  };
}

async function getSupplierAnalytics(userId: string) {
  const supplier = await prisma.suppliers.findFirst({
    where: { userId },
  });

  // Get global counts for the dashboard cards
  const [
    globalTotalProducts,
    globalApprovedProducts,
    globalPendingProducts,
    globalRejectedProducts,
    globalTotalMatches,
    globalTotalSuppliers
  ] = await Promise.all([
    prisma.products.count(),
    prisma.products.count({ where: { status: 'APPROVED' } }),
    prisma.products.count({ where: { status: 'PENDING' } }),
    prisma.products.count({ where: { status: 'REJECTED' } }),
    prisma.products.aggregate({
      _sum: { recommendations: true },
    }).then(res => res._sum.recommendations ?? 0),
    prisma.suppliers.count(),
  ]);

  if (!supplier) {
    return {
      scope: 'supplier',
      summary: {
        totalProducts: globalTotalProducts,
        approvedProducts: globalApprovedProducts,
        pendingProducts: globalPendingProducts,
        rejectedProducts: globalRejectedProducts,
        totalMatches: globalTotalMatches,
        totalViews: 0,
      },
      products: [],
    };
  }

  const products = await prisma.products.findMany({
    where: {
      supplierId: supplier.id,
    },
    select: {
      id: true,
      name: true,
      recommendations: true,
      views: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      recommendations: 'desc',
    },
  });

  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);

  return {
    scope: 'supplier',
    summary: {
      totalProducts: globalTotalProducts,
      totalSuppliers: globalTotalSuppliers,
      approvedProducts: globalApprovedProducts,
      pendingProducts: globalPendingProducts,
      rejectedProducts: globalRejectedProducts,
      totalMatches: globalTotalMatches,
      totalViews,
    },
    products: products.map(p => ({
      id: p.id,
      title: p.name,
      matchCount: p.recommendations,
      viewCount: p.views,
      status: p.status,
      createdAt: p.createdAt,
    })),
  };
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

    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (isAdmin) {
      try {
        const overview = await getAdminOverview();
        return NextResponse.json(overview);
      } catch (error) {
        console.error('Admin overview database query failed:', error);
        return NextResponse.json(
          { error: 'Database query failed for admin overview. Ensure MongoDB is running and seeded.' },
          { status: 500 }
        );
      }
    }

    const supplierAnalytics = await getSupplierAnalytics(session.user.id);

    if (supplierAnalytics && 'status' in supplierAnalytics && (supplierAnalytics as any).status === 404) {
      return NextResponse.json(
        {
          error: (supplierAnalytics as any).error,
          redirect: (supplierAnalytics as any).redirect,
        },
        { status: (supplierAnalytics as any).status }
      );
    }

    return NextResponse.json(supplierAnalytics);
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching analytics' },
      { status: 500 }
    );
  }
}
