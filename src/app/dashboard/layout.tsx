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

  // Check if user has a supplier profile
  let supplier;
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

  try {
    supplier = await prisma.suppliers.findFirst({
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

  // Dashboard layout should be accessible even if no supplier profile exists yet
  return <DashboardLayout>{children}</DashboardLayout>;
}

