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
          products: { _count: 'desc' },
        },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { products: true, inquiries: true } },
          products: {
            select: {
              recommendations: true,
              views: true,
              status: true,
            },
          },
        },
      }),
      prisma.suppliers.findMany({
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
      prisma.products.findMany({
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

    const totalMatches = productAggregate._sum.recommendations ?? 0;
    const totalViews = productAggregate._sum.views ?? 0;

    const topSuppliers = topSuppliersRaw.map((supplier) => {
      const approvedProductCount = supplier.products.filter(
        (p) => p.status === 'APPROVED'
      ).length;
      const supplierMatches = supplier.products.reduce(
        (sum, p) => sum + p.recommendations,
        0
      );
      const supplierViews = supplier.products.reduce(
        (sum, p) => sum + p.views,
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

