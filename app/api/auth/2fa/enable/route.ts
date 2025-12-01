import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { generate2FACode, hash2FACode, get2FACodeExpiry } from '@/lib/auth/2fa';
import { send2FACodeSMS } from '@/lib/sms/twilio';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/sms/twilio';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || !validatePhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please use format: +1234567890' },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generate2FACode();
    const codeHash = hash2FACode(code);
    const expiryDate = get2FACodeExpiry();

    // Store phone number and verification code (temporarily)
    // We'll store the code in twoFactorSecret temporarily until verified
    await db
      .update(users)
      .set({
        phoneNumber: formattedPhone,
        twoFactorSecret: JSON.stringify({
          code: codeHash,
          expires: expiryDate.toISOString(),
        }),
      })
      .where(eq(users.id, user.id));

    // Send verification code via SMS
    const smsSent = await send2FACodeSMS(formattedPhone, code);

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
    console.error('Error enabling 2FA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
