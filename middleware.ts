import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const protectedRoutes = '/dashboard';
const emailVerificationExemptRoutes = [
  '/auth/verify-email',
  '/auth/verify-pending',
  '/auth/resend-verification',
  '/sign-in',
  '/sign-up',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/user',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = pathname.startsWith(protectedRoutes) || pathname === '/onboarding';
  const isEmailVerificationExempt = emailVerificationExemptRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });

      // Check email verification for protected routes (except exempted routes)
      if (isProtectedRoute && !isEmailVerificationExempt) {
        const userId = parsed.user.id;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        // Only require email verification for owners
        if (user && user.role === 'owner' && !user.emailVerified) {
          return NextResponse.redirect(new URL('/auth/verify-pending', request.url));
        }
      }
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
