import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, setSession } from '@/lib/auth/session';
import { sendEmailVerification } from '@/lib/email/sendgrid';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      employer,
      jobTitle,
      worksite,
      employmentStatus,
      // Optional fields
      address,
      dateOfBirth,
      memberId,
      localChapter,
      bargainingUnit,
      startDateWithEmployer,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !employer || !jobTitle || !worksite || !employmentStatus) {
      return NextResponse.json(
        { error: 'All required fields must be filled in' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
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

    // Check if user with this email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Check if this user is already a member of this specific union
      const [existingMembership] = await db
        .select()
        .from(members)
        .where(and(
          eq(members.userId, existingUser.id),
          eq(members.unionId, union.id)
        ))
        .limit(1);

      if (existingMembership) {
        const unionFullName = union.localNumber
          ? `${union.name} Local ${union.localNumber}`
          : union.name;
        return NextResponse.json(
          { error: `Failed to create user, user is already a member of ${unionFullName}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const emailVerificationRequired = union.requireEmailVerification !== false;

    // Only generate a verification token when email verification is required
    const verificationToken = emailVerificationRequired
      ? crypto.randomBytes(32).toString('hex')
      : null;
    const verificationExpiry = emailVerificationRequired
      ? (() => { const d = new Date(); d.setHours(d.getHours() + 24); return d; })()
      : null;

    // Create user with first and last name
    const [newUser] = await db
      .insert(users)
      .values({
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        role: 'member',
        emailVerified: !emailVerificationRequired,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      })
      .returning();

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Add user as member of this union (pending approval) with all fields
    await db.insert(members).values({
      userId: newUser.id,
      unionId: union.id,
      role: 'member',
      status: 'pending',
      // Required fields
      phone,
      employer,
      jobTitle,
      worksite,
      employmentStatus,
      // Optional fields
      address: address || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      memberId: memberId || null,
      localChapter: localChapter || null,
      bargainingUnit: bargainingUnit || null,
      startDateWithEmployer: startDateWithEmployer ? new Date(startDateWithEmployer) : null,
    });

    if (emailVerificationRequired) {
      // Send verification email
      try {
        await sendEmailVerification(
          email,
          verificationToken!,
          newUser.name || firstName,
          { name: union.name, localNumber: union.localNumber }
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the signup if email fails, but log it
      }

      // Don't set session - require email verification first
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    }

    // Email verification disabled for this union — log the member in immediately
    await setSession(newUser);

    return NextResponse.json({
      success: true,
      requiresVerification: false,
      message: 'Account created successfully. Your membership application is pending approval by a union administrator.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
