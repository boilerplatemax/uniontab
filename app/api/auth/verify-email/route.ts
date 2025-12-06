import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members, unions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { signToken } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationExpiry, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, user.id));

    // Auto-login: Create session for the user
    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await signToken({
      user: {
        id: user.id,
      },
      expires: expiresInOneDay.toISOString(),
    });

    // Get user's union membership to determine redirect
    const [membership] = await db
      .select({
        unionId: members.unionId,
        role: members.role,
        unionSlug: unions.slug,
        publishedAt: unions.publishedAt,
      })
      .from(members)
      .leftJoin(unions, eq(members.unionId, unions.id))
      .where(eq(members.userId, user.id))
      .limit(1);

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        role: user.role,
        membership: membership ? {
          role: membership.role,
          unionSlug: membership.unionSlug,
          needsOnboarding: membership.role === 'owner' && !membership.publishedAt,
        } : null,
      },
    });

    // Set session cookie
    response.cookies.set({
      name: 'session',
      value: sessionToken,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expiresInOneDay,
    });

    return response;
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
