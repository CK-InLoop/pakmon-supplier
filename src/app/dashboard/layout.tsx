import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { prisma } from '@/lib/prisma';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Check if user has completed onboarding (has supplier profile)
  const supplier = await prisma.suppliers.findUnique({
    where: { userId: session.user.id },
    select: { id: true, companyName: true },
  });

  // If no supplier profile exists, redirect to onboarding
  if (!supplier) {
    redirect('/onboarding');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

