import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const adminRoutes = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes) || pathname === '/onboarding';
  const isAdminRoute = pathname.startsWith(adminRoutes);

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
