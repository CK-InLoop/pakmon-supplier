import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, companyName, phone, address, description } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the verified supplier by email
    const supplier = await prisma.supplier.findUnique({
      where: { email },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    if (!supplier.verified) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 400 }
      );
    }

    // Update the supplier profile
    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        companyName,
        phone,
        address,
        description,
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        address: true,
        description: true,
        verified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile completed successfully',
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'An error occurred while completing profile' },
      { status: 500 }
    );
  }
}
