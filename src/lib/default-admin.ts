import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const FALLBACK_ADMIN_EMAIL = 'ckakadiya1105@gmail.com';

export function getDefaultAdminEmail() {
  return (process.env.DEFAULT_ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL).trim().toLowerCase();
}

export async function ensureDefaultAdmin() {
  const email = getDefaultAdminEmail();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!password) {
    return prisma.users.findUnique({
      where: { email },
      include: { suppliers: true },
    });
  }

  const version = process.env.DEFAULT_ADMIN_BOOTSTRAP_VERSION || '1';
  const markerKey = `auth.default-admin.${version}`;
  const [existingUser, marker] = await Promise.all([
    prisma.users.findUnique({ where: { email } }),
    prisma.systemSetting.findUnique({ where: { key: markerKey } }),
  ]);

  let user = existingUser;
  if (!user || !marker) {
    const passwordHash = await hash(password, 12);
    user = await prisma.users.upsert({
      where: { email },
      update: {
        name: 'Pakmon Admin',
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
      create: {
        name: 'Pakmon Admin',
        email,
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    const supplier = await prisma.suppliers.findFirst({ where: { userId: user.id } });
    if (!supplier) {
      await prisma.suppliers.create({
        data: {
          userId: user.id,
          name: 'Pakmon Admin',
          email,
          password: passwordHash,
          companyName: 'Pakmon Dairy Solutions',
          status: 'APPROVED',
          verified: true,
        },
      });
    }

    await prisma.systemSetting.upsert({
      where: { key: markerKey },
      update: { value: { email, initializedAt: new Date().toISOString() } },
      create: { key: markerKey, value: { email, initializedAt: new Date().toISOString() } },
    });
  }

  return prisma.users.findUnique({
    where: { email },
    include: { suppliers: true },
  });
}
