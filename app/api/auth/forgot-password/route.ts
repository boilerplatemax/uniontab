import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members, unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '@/lib/email/sendgrid';
import crypto from 'crypto';
import {
  checkRateLimit,
  getClientIp,
  passwordResetRateLimit,
} from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  try {
    // Apply rate limiting to prevent abuse
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, passwordResetRateLimit);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success even if user not found (security best practice)
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If that email exists in our system, a password reset link has been sent.',
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Get user's union information for the email
    const [membership] = await db
      .select({
        union: unions
      })
      .from(members)
      .innerJoin(unions, eq(members.unionId, unions.id))
      .where(eq(members.userId, user.id))
      .limit(1);

    const unionInfo = membership?.union ? {
      name: membership.union.publicName || membership.union.name,
      localNumber: membership.union.localNumber
    } : null;

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name, unionInfo);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - don't reveal that email failed
    }

    return NextResponse.json({
      message: 'If that email exists in our system, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
