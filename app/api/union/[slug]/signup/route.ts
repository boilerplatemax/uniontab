import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
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
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with first and last name
    const [newUser] = await db
      .insert(users)
      .values({
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        role: 'member'
      })
      .returning();

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Add user as member of this union (pending approval)
    await db.insert(members).values({
      userId: newUser.id,
      unionId: union.id,
      role: 'member',
      status: 'pending'
    });

    // Set session
    await setSession(newUser);

    return NextResponse.json({
      success: true,
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
