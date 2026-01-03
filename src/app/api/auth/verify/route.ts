import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signIn } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verification_tokens.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      await prisma.verification_tokens.delete({
        where: { token },
      });
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Update user as verified
    const user = await prisma.users.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete verification token
    await prisma.verification_tokens.delete({
      where: { token },
    });

    // Return success response with user data for auto-login
    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verified: !!user.emailVerified
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}


