import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmailVerification } from '@/lib/email/sendgrid';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

    // Update user with new token
    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      })
      .where(eq(users.id, user.id));

    // Send verification email
    await sendEmailVerification(user.email, verificationToken, user.name);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
