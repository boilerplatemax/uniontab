import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

// Middleware for authentication and subdomain routing
const adminRoutes = '/admin';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname === '/onboarding';
  const isAdminRoute = pathname.startsWith(adminRoutes);

  // Block all mutating API calls in demo mode
  const isDemo = request.cookies.get('demo_mode')?.value === '1';
  if (isDemo && request.method !== 'GET' && pathname.startsWith('/api/')) {
    const allowed = ['/demo-login', '/api/announcements/dismiss'];
    if (!allowed.some((p) => pathname.includes(p))) {
      return NextResponse.json(
        { error: 'This action is disabled in demo mode.' },
        { status: 403 }
      );
    }
  }

  // Handle subdomain routing for info.uniontab.com
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Check if this is the info subdomain
  if (hostname.startsWith('info.')) {
    // Rewrite to /info path
    if (pathname === '/') {
      url.pathname = '/info';
      return NextResponse.rewrite(url);
    }
    // For other paths on info subdomain, prefix with /info
    if (!pathname.startsWith('/info')) {
      url.pathname = `/info${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Redirect to sign-in if accessing protected routes without session
  if ((isProtectedRoute || isAdminRoute) && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // For admin routes, verify session exists (detailed role check happens in the page)
  if (isAdminRoute && sessionCookie) {
    try {
      await verifyToken(sessionCookie.value);
    } catch {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
