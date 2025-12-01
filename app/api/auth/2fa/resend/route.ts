import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { generate2FACode, hash2FACode, get2FACodeExpiry } from '@/lib/auth/2fa';
import { send2FACodeSMS } from '@/lib/sms/twilio';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData || !userData.phoneNumber) {
      return NextResponse.json(
        { error: 'No phone number found' },
        { status: 400 }
      );
    }

    // Generate new verification code
    const code = generate2FACode();
    const codeHash = hash2FACode(code);
    const expiryDate = get2FACodeExpiry();

    // Store new verification code
    await db
      .update(users)
      .set({
        twoFactorSecret: JSON.stringify({
          code: codeHash,
          expires: expiryDate.toISOString(),
        }),
      })
      .where(eq(users.id, user.id));

    // Send verification code via SMS
    const smsSent = await send2FACodeSMS(userData.phoneNumber, code);

    if (!smsSent) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your phone',
    });
  } catch (error) {
    console.error('Error resending 2FA code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
