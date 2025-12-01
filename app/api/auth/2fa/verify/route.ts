import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { verify2FACode, is2FACodeExpired } from '@/lib/auth/2fa';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Get user data with 2FA secret
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData || !userData.twoFactorSecret) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Parse stored code data
    let codeData;
    try {
      codeData = JSON.parse(userData.twoFactorSecret);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid verification data' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const expiryDate = new Date(codeData.expires);
    if (is2FACodeExpired(expiryDate)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify code
    const isValid = verify2FACode(code, codeData.code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA for user
    await db
      .update(users)
      .set({
        twoFactorEnabled: true,
        twoFactorSecret: null, // Clear temporary code
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
