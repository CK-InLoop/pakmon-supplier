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

    // Find the verified user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found. Please sign up first.',
          redirect: '/signup'
        },
        { status: 404 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified. Please verify your email first.',
          redirect: '/auth/verify'
        },
        { status: 400 }
      );
    }

    if (user.role !== 'SUPPLIER') {
      return NextResponse.json(
        {
          error: 'Only suppliers can complete onboarding',
          redirect: '/login'
        },
        { status: 400 }
      );
    }

    // Create or update the supplier profile
    const supplier = await prisma.suppliers.upsert({
      where: { userId: user.id },
      update: {
        companyName,
        contactPhone: phone,
        address,
        description,
        contactEmail: email,
      },
      create: {
        userId: user.id,
        companyName,
        contactPhone: phone,
        address,
        description,
        contactEmail: email,
      },
      select: {
        id: true,
        companyName: true,
        contactPhone: true,
        address: true,
        description: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile completed successfully',
      supplier,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'An error occurred while completing profile' },
      { status: 500 }
    );
  }
}
