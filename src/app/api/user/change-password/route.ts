import { compare, hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from the current password.' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });
    if (!user?.password || !(await compare(currentPassword, user.password))) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        password: passwordHash,
        suppliers: {
          updateMany: {
            where: {},
            data: { password: passwordHash },
          },
        },
      },
    });

    return NextResponse.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to change password.' }, { status: 500 });
  }
}
