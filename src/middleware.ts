import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Use NextAuth's auth function to check session
  const session = await auth();
  
  console.log('Middleware - Path:', request.nextUrl.pathname, 'Session:', !!session);
  
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password');

  const isPublicPage =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/verify') ||
    request.nextUrl.pathname.startsWith('/auth/error') ||
    request.nextUrl.pathname.startsWith('/onboarding');

  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard');

  // If user has session and tries to access auth pages, redirect to dashboard
  if (session && isAuthPage) {
    console.log('Redirecting authenticated user from auth page to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user doesn't have session and tries to access protected pages
  if (!session && isProtectedPage) {
    console.log('Redirecting unauthenticated user to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Middleware - Allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
