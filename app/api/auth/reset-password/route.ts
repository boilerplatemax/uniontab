import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members, unions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.resetToken, token),
          gt(users.resetTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Get the user's union slug for redirect
    const [membership] = await db
      .select({
        unionSlug: unions.slug,
      })
      .from(members)
      .innerJoin(unions, eq(members.unionId, unions.id))
      .where(eq(members.userId, user.id))
      .limit(1);

    // Auto-login: Create session for the user
    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await signToken({
      user: {
        id: user.id,
      },
      expires: expiresInOneDay.toISOString(),
    });

    const response = NextResponse.json({
      message: 'Password has been reset successfully',
      unionSlug: membership?.unionSlug,
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
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
