import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppPhone, readWhatsAppPhone, WHATSAPP_SETTING_KEY } from '@/lib/whatsapp-setting';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [user, whatsappSetting] = await Promise.all([
      prisma.users.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.systemSetting.findUnique({ where: { key: WHATSAPP_SETTING_KEY } }),
    ]);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user,
      whatsappPhone: readWhatsAppPhone(whatsappSetting?.value),
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, email, whatsappPhone } = body;
    const hasWhatsAppPhone = Object.prototype.hasOwnProperty.call(body, 'whatsappPhone');
    if (!name && !email && !hasWhatsAppPhone) {
      return NextResponse.json({ error: 'Name, email, or WhatsApp phone number is required' }, { status: 400 });
    }

    let normalizedWhatsApp: ReturnType<typeof normalizeWhatsAppPhone> | undefined;
    if (hasWhatsAppPhone) {
      try {
        normalizedWhatsApp = normalizeWhatsAppPhone(String(whatsappPhone || ''));
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid WhatsApp phone number' },
          { status: 400 }
        );
      }
    }

    if (email) {
      const existingUser = await prisma.users.findFirst({
        where: {
          email: { equals: String(email).trim().toLowerCase(), mode: 'insensitive' },
          NOT: { id: session.user.id },
        },
      });
      if (existingUser) return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
    }

    const updateData: { name?: string; email?: string } = {};
    if (name) updateData.name = String(name).trim();
    if (email) updateData.email = String(email).trim().toLowerCase();

    const updatedUser = Object.keys(updateData).length > 0
      ? await prisma.users.update({
          where: { id: session.user.id },
          data: updateData,
          select: { id: true, name: true, email: true },
        })
      : await prisma.users.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true },
        });

    if (normalizedWhatsApp) {
      await prisma.systemSetting.upsert({
        where: { key: WHATSAPP_SETTING_KEY },
        update: { value: normalizedWhatsApp },
        create: { key: WHATSAPP_SETTING_KEY, value: normalizedWhatsApp },
      });
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      user: updatedUser,
      whatsappPhone: normalizedWhatsApp?.phone,
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
