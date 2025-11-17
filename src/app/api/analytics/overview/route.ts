import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalSuppliers,
      approvedSuppliers,
      pendingSuppliers,
      totalProducts,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      totalInquiries,
      respondedInquiries,
      productAggregate,
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
          products: { _count: 'desc' },
        },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { products: true, inquiries: true } },
          products: {
            select: {
              matchCount: true,
              viewCount: true,
              status: true,
            },
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
          supplier: { select: { companyName: true } },
        },
      }),
    ]);

    const totalMatches = productAggregate._sum.matchCount ?? 0;
    const totalViews = productAggregate._sum.viewCount ?? 0;

    const topSuppliers = topSuppliersRaw.map((supplier) => {
      const approvedProductCount = supplier.products.filter(
        (p) => p.status === 'APPROVED'
      ).length;
      const supplierMatches = supplier.products.reduce(
        (sum, p) => sum + p.matchCount,
        0
      );
      const supplierViews = supplier.products.reduce(
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
        totalMatches: supplierMatches,
        totalViews: supplierViews,
        inquiries: supplier._count.inquiries,
      };
    });

    return NextResponse.json({
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
          responded: respondedInquiries,
        },
        engagement: {
          totalMatches,
          totalViews,
        },
      },
      topSuppliers,
      recentActivity: {
        suppliers: recentSuppliers,
        products: recentProducts,
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics overview' },
      { status: 500 }
    );
  }
}

