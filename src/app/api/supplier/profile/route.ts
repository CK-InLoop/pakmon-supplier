import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    const isDefaultUser = session.user.email === 'admin@example.com';

    // Find user with supplier profile
    let user;
    try {
      user = await prisma.users.findUnique({
        where: { id: session.user.id },
        include: {
          supplier: true,
        },
      });
    } catch (dbError) {
      console.warn('Database failed while looking up profile, trying mock fallback...');
    }

    if ((!user || !user.supplier) && isDefaultUser) {
      const mockSupplier = mockStore.suppliers[0];
      const supplier = {
        id: mockSupplier.id,
        name: session.user.name || 'Demo User',
        email: session.user.email,
        companyName: mockSupplier.companyName,
        phone: mockSupplier.contactPhone || mockSupplier.phone,
        address: mockSupplier.address,
        description: mockSupplier.description,
        verified: !!mockSupplier.verified,
        status: mockSupplier.status,
        createdAt: mockSupplier.createdAt,
      };
      return NextResponse.json({ supplier });
    }

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
      verified: !!user.supplier.verified, // Use supplier verification status
      status: user.supplier.status,       // Include explicit status
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
    const isDefaultUser = session.user.email === 'admin@example.com';

    // Update supplier profile
    let updatedSupplier;
    try {
      updatedSupplier = await prisma.suppliers.update({
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
    } catch (dbError) {
      console.warn('Database failed while updating profile, falling back to mock...');
      if (isDefaultUser) {
        const mockSupplier = mockStore.suppliers[0];
        mockSupplier.companyName = companyName;
        mockSupplier.contactPhone = phone;
        mockSupplier.phone = phone;
        mockSupplier.address = address;
        mockSupplier.description = description;

        updatedSupplier = {
          ...mockSupplier,
          phone: undefined, // match the expected shape if needed
        };
      } else {
        throw dbError;
      }
    }

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


