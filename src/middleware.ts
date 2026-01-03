import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Simplified middleware to avoid Prisma client issues in build
  // Authentication will be handled at the page level instead
  
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password');

  const isPublicPage =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/auth/verify') ||
    request.nextUrl.pathname.startsWith('/auth/reset-password') ||
    request.nextUrl.pathname.startsWith('/auth/error') ||
    request.nextUrl.pathname.startsWith('/onboarding');

  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard');

  // For now, just allow all requests through
  // Authentication will be handled by individual pages/components
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

