import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mockStore } from '@/lib/mock-store';

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
    prisma.suppliers.count({ where: { status: 'APPROVED' } }),
    prisma.suppliers.count({ where: { status: 'PENDING' } }),
    prisma.products.count(),
    prisma.products.count({ where: { status: 'APPROVED' } }),
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
      (sum, p) => sum + p.recommendations,
      0
    );
    const totalSupplierViews = supplier.products.reduce(
      (sum, p) => sum + p.views,
      0
    );

    return {
      id: supplier.id,
      companyName: supplier.companyName,
      status: supplier.status,
      contactName: supplier.name,
      contactEmail: supplier.email,
      totalProducts: supplier._count.products,
      approvedProducts: approvedProductCount,
      totalMatches: totalSupplierMatches,
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
        pending: pendingSuppliers,
      },
      products: {
        total: totalProducts,
        approved: approvedProducts,
        pending: pendingProducts,
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
  const supplier = await prisma.suppliers.findUnique({
    where: { userId },
  });

  if (!supplier) {
    return {
      error: 'Supplier profile not found. Please complete onboarding first.',
      redirect: '/onboarding',
      status: 404,
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

  const totalProducts = products.length;
  const approvedProducts = products.filter(
    (p) => p.status === 'APPROVED'
  ).length;
  const pendingProducts = products.filter(
    (p) => p.status === 'PENDING'
  ).length;
  const rejectedProducts = products.filter(
    (p) => p.status === 'REJECTED'
  ).length;
  const totalMatches = products.reduce((sum, p) => sum + p.recommendations, 0);
  const totalViews = products.reduce((sum, p) => sum + p.views, 0);

  return {
    scope: 'supplier',
    summary: {
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      totalMatches,
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

async function getMockSupplierAnalytics() {
  const products = mockStore.products;
  const totalProducts = products.length;
  const approvedProducts = products.filter(p => p.status === 'APPROVED').length;
  const pendingProducts = products.filter(p => p.status === 'PENDING').length;
  const rejectedProducts = products.filter(p => p.status === 'REJECTED').length;
  const totalMatches = products.reduce((sum, p) => sum + (p.matchCount || p.recommendations || 0), 0);
  const totalViews = products.reduce((sum, p) => sum + (p.viewCount || p.views || 0), 0);

  return {
    scope: 'supplier',
    summary: {
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      totalMatches,
      totalViews,
    },
    products: products.map(p => ({
      id: p.id,
      title: p.title || p.name,
      matchCount: p.matchCount || p.recommendations || 0,
      viewCount: p.viewCount || p.views || 0,
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

    const isAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (isAdmin) {
      const overview = await getAdminOverview();
      return NextResponse.json(overview);
    }

    const isDefaultUser = session.user.email === 'admin@example.com';
    let supplierAnalytics;

    try {
      supplierAnalytics = await getSupplierAnalytics(session.user.id);
    } catch (error) {
      console.warn('Database failed for analytics, trying mock fallback...');
      if (isDefaultUser) {
        supplierAnalytics = await getMockSupplierAnalytics();
      } else {
        throw error;
      }
    }

    if (supplierAnalytics && 'status' in supplierAnalytics && supplierAnalytics.status === 404) {
      if (isDefaultUser) {
        supplierAnalytics = await getMockSupplierAnalytics();
      } else {
        return NextResponse.json(
          {
            error: supplierAnalytics.error,
            redirect: supplierAnalytics.redirect,
          },
          { status: supplierAnalytics.status }
        );
      }
    }

    return NextResponse.json(supplierAnalytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching analytics' },
      { status: 500 }
    );
  }
}


