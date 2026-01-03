import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user with supplier role (default for signups from /signup page)
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
        role: role || 'SUPPLIER', // Default to SUPPLIER if not specified
      },
    });

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours expiry

    await prisma.verification_tokens.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, token, name);

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}


