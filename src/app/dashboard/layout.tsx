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
  let supplier;

  if (session.user.email === 'admin@example.com') {
    // Mock supplier for default user
    supplier = { id: 'default-supplier-id', companyName: 'Default Supplier Co.' };
  } else {
    try {
      supplier = await prisma.suppliers.findUnique({
        where: { userId: session.user.id },
        select: { id: true, companyName: true },
      });
    } catch (error) {
      console.error('Database connection failed, but proceeding if default user logic was missed (should not happen for default user):', error);
      // Fallback or re-throw, but for now we expect real users to need DB.
      // If DB is down, real users can't login anyway because of auth.ts check.
    }
  }

  // If no supplier profile exists, redirect to onboarding
  if (!supplier) {
    redirect('/onboarding');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

