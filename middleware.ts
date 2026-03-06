import { NextRequest, NextResponse } from 'next/server';

// Block all mutating API calls when the user is in demo mode.
// The demo_mode cookie is set by /api/union/[slug]/demo-login and cleared on sign-out.
export function middleware(request: NextRequest) {
  const isDemo = request.cookies.get('demo_mode')?.value === '1';

  if (isDemo && request.method !== 'GET') {
    const pathname = request.nextUrl.pathname;

    // Allow: demo login itself, sign-out, announcement dismiss (UI-only state)
    const allowed = [
      '/demo-login',
      '/api/announcements/dismiss',
    ];
    if (allowed.some((p) => pathname.includes(p))) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'This action is disabled in demo mode.' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
