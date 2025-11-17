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
    prisma.supplier.count(),
    prisma.supplier.count({ where: { status: 'APPROVED' } }),
    prisma.supplier.count({ where: { status: 'PENDING' } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'APPROVED' } }),
    prisma.product.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { status: 'REJECTED' } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: 'responded' } }),
    prisma.product.aggregate({
      _sum: { matchCount: true, viewCount: true },
    }),
    prisma.supplier.findMany({
      take: 5,
      orderBy: {
        products: {
          _count: 'desc',
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        _count: {
          select: { products: true, inquiries: true },
        },
        products: {
          select: { matchCount: true, viewCount: true, status: true },
        },
      },
    }),
    prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        companyName: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        supplier: {
          select: { companyName: true },
        },
      },
    }),
  ]);

  const totalMatches = productStats._sum.matchCount ?? 0;
  const totalViews = productStats._sum.viewCount ?? 0;

  const topSuppliers = topSuppliersRaw.map((supplier) => {
    const approvedProductCount = supplier.products.filter(
      (p) => p.status === 'APPROVED'
    ).length;
    const totalSupplierMatches = supplier.products.reduce(
      (sum, p) => sum + p.matchCount,
      0
    );
    const totalSupplierViews = supplier.products.reduce(
      (sum, p) => sum + p.viewCount,
      0
    );

    return {
      id: supplier.id,
      companyName: supplier.companyName,
      status: supplier.status,
      contactName: supplier.user?.name,
      contactEmail: supplier.user?.email,
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
  const supplier = await prisma.supplier.findUnique({
    where: { userId },
  });

  if (!supplier) {
    return {
      error: 'Supplier profile not found. Please complete onboarding first.',
      redirect: '/onboarding',
      status: 404,
    };
  }

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
  const totalMatches = products.reduce((sum, p) => sum + p.matchCount, 0);
  const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);

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
    products,
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

    const supplierAnalytics = await getSupplierAnalytics(session.user.id);

    if ('status' in supplierAnalytics && supplierAnalytics.status === 404) {
      return NextResponse.json(
        {
          error: supplierAnalytics.error,
          redirect: supplierAnalytics.redirect,
        },
        { status: supplierAnalytics.status }
      );
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

