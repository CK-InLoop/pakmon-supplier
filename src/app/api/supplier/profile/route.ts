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

    // Find user with supplier profile
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      include: {
        supplier: true,
      },
    });

    if (!user || !user.supplier) {
      return NextResponse.json(
        {
          error: 'Supplier profile not found. Please complete onboarding first.',
          redirect: '/onboarding'
        },
        { status: 404 }
      );
    }

    const supplier = {
      id: user.supplier.id,
      name: user.name,
      email: user.email,
      companyName: user.supplier.companyName,
      phone: user.supplier.contactPhone,
      address: user.supplier.address,
      description: user.supplier.description,
      verified: !!user.supplier.verified,
      status: user.supplier.status,
      createdAt: user.supplier.createdAt,
    };

    return NextResponse.json({ supplier });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching profile' },
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

    const body = await req.json();
    const { companyName, phone, address, description } = body;

    // Update supplier profile
    const updatedSupplier = await prisma.suppliers.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        contactPhone: phone,
        address,
        description,
      },
      select: {
        id: true,
        companyName: true,
        contactPhone: true,
        address: true,
        description: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      supplier: updatedSupplier,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}


