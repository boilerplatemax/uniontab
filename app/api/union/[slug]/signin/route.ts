import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { unions, users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { comparePasswords, setSession } from '@/lib/auth/session';
import { checkLoginLocked, recordFailedLogin, clearLoginAttempts } from '@/lib/utils/rate-limit';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if this account is temporarily locked due to too many failed attempts
    const lockStatus = checkLoginLocked(email);
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil((lockStatus.retryAfterMs ?? 0) / 60000);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
        },
        { status: 429 }
      );
    }

    // Find the union by slug
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.slug, slug))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Still record a failed attempt to prevent email enumeration via timing
      recordFailedLogin(email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      recordFailedLogin(email);
      const lockAfter = checkLoginLocked(email);
      if (lockAfter.locked) {
        return NextResponse.json(
          { error: 'Too many failed login attempts. Your account is locked for 5 minutes.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is a member of THIS union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.userId, user.id), eq(members.unionId, union.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        {
          error: `You are not a member of this union. Please contact ${union.name} to join.`
        },
        { status: 403 }
      );
    }

    // Successful login — clear any accumulated failed-attempt counter
    clearLoginAttempts(email);

    // Set session
    await setSession(user);

    // Revalidate the union pages to ensure fresh data (especially admin status) is fetched
    revalidatePath(`/${slug}`, 'layout');
    revalidatePath(`/${slug}`, 'page');

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    );
  }
}
