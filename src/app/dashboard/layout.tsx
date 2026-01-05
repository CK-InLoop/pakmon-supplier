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

  try {
    supplier = await prisma.suppliers.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyName: true },
    });
  } catch (error) {
    console.error('Database connection failed while fetching supplier profile:', error);
    // If we have a malformed ID (likely from a stale session/mock ID), 
    // redirect to signout to force a session refresh.
    if (error instanceof Error && (error.message.includes('Malformed ObjectID') || error.message.includes('default-admin-id'))) {
      console.warn('Malformed ObjectID or mock ID detected in session. Forcing signout to clear stale cookies.');
      redirect('/api/auth/signout');
    }
  }

  // If no supplier profile exists, redirect to onboarding
  if (!supplier) {
    redirect('/onboarding');
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

