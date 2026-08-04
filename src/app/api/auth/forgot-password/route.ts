import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureDefaultAdmin, getDefaultAdminEmail } from '@/lib/default-admin';
import { sendPasswordResetEmail } from '@/lib/email';
import { hashResetToken, resetIdentifier } from '@/lib/password-reset';
import { prisma } from '@/lib/prisma';

const SUCCESS_MESSAGE = 'If an account exists for that email, password reset instructions have been sent.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = email === getDefaultAdminEmail()
      ? await ensureDefaultAdmin()
      : await prisma.users.findUnique({ where: { email } });

    if (!user) return NextResponse.json({ message: SUCCESS_MESSAGE });

    const rawToken = randomBytes(32).toString('hex');
    const identifier = resetIdentifier(email);
    await prisma.verification_tokens.deleteMany({ where: { identifier } });
    await prisma.verification_tokens.create({
      data: {
        identifier,
        token: hashResetToken(rawToken),
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(email, rawToken, user.name || 'User');
    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Unable to send a reset email right now. Please try again.' }, { status: 500 });
  }
}
