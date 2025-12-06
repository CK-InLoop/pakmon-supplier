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

    // Check if user is a supplier
    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json(
        { error: 'Only suppliers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get supplier profile
    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    const inquiries = await prisma.inquiries.findMany({
      where: {
        supplierId: supplier.id,
      },
      include: {
        product: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Get supplier inquiries error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching inquiries' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a supplier
    if (session.user.role !== 'SUPPLIER') {
      return NextResponse.json(
        { error: 'Only suppliers can access this endpoint' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { inquiryId, status } = body;

    if (!inquiryId || !status) {
      return NextResponse.json(
        { error: 'Inquiry ID and status are required' },
        { status: 400 }
      );
    }

    // Get supplier profile
    const supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      );
    }

    // Ensure the inquiry belongs to this supplier
    const existingInquiry = await prisma.inquiries.findFirst({
      where: {
        id: inquiryId,
        supplierId: supplier.id,
      },
    });

    if (!existingInquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    // Update inquiry status using the primary key
    const inquiry = await prisma.inquiries.update({
      where: {
        id: existingInquiry.id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: 'Inquiry status updated successfully',
      inquiry,
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating inquiry' },
      { status: 500 }
    );
  }
}
