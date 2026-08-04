import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { emailFromResetIdentifier, hashResetToken } from '@/lib/password-reset';
import { prisma } from '@/lib/prisma';

async function getValidReset(token: string) {
  const hashedToken = hashResetToken(token);
  const verificationToken = await prisma.verification_tokens.findUnique({
    where: { token: hashedToken },
  });
  if (!verificationToken) return null;

  const email = emailFromResetIdentifier(verificationToken.identifier);
  if (!email || verificationToken.expires < new Date()) {
    await prisma.verification_tokens.delete({ where: { token: hashedToken } }).catch(() => undefined);
    return null;
  }

  const user = await prisma.users.findUnique({ where: { email } });
  return user ? { user, hashedToken } : null;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    const reset = await getValidReset(token);
    if (!reset) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });
    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Unable to verify this reset link.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'A valid token and password of at least 8 characters are required.' }, { status: 400 });
    }

    const reset = await getValidReset(token);
    if (!reset) return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 400 });

    const passwordHash = await hash(password, 12);
    await prisma.users.update({ where: { id: reset.user.id }, data: { password: passwordHash } });
    await prisma.suppliers.updateMany({ where: { userId: reset.user.id }, data: { password: passwordHash } });
    await prisma.verification_tokens.delete({ where: { token: reset.hashedToken } });
    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Unable to reset your password right now.' }, { status: 500 });
  }
}
