import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, unions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendMemberInviteEmail } from '@/lib/email/sendgrid';
import {
  checkEmailInviteLimit,
  incrementEmailInviteUsage,
  isPaidSubscription,
} from '@/lib/membership/limits';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse and validate emails from input
 * Supports both single email and newline-separated emails (for bulk)
 */
function parseEmails(input: string): { valid: string[]; invalid: string[] } {
  const emails = input
    .split(/[\n,;]+/) // Split by newlines, commas, or semicolons
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const email of emails) {
    // Skip duplicates
    if (seen.has(email)) {
      continue;
    }
    seen.add(email);

    if (EMAIL_REGEX.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

// POST - Send email invites
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emails: emailInput, unionId } = body;

    if (!emailInput || typeof emailInput !== 'string') {
      return NextResponse.json(
        { error: 'Email input is required' },
        { status: 400 }
      );
    }

    if (!unionId || typeof unionId !== 'number') {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionId),
          eq(members.userId, user.id),
          eq(members.status, 'approved')
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can send email invites' },
        { status: 403 }
      );
    }

    // Get union info
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Parse and validate emails
    const { valid: validEmails, invalid: invalidEmails } = parseEmails(emailInput);

    if (validEmails.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid email addresses provided',
          invalidEmails,
        },
        { status: 400 }
      );
    }

    // Check email invite limits
    const limitCheck = await checkEmailInviteLimit(unionId, validEmails.length);

    if (!limitCheck.canSend) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          isPaid: limitCheck.isPaid,
        },
        { status: 429 }
      );
    }

    // Get inviter's name for the email
    const inviterName = user.name;

    // Send invites
    const results = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[],
    };

    for (const email of validEmails) {
      try {
        await sendMemberInviteEmail(
          email,
          {
            name: union.name,
            localNumber: union.localNumber,
            slug: union.slug,
          },
          inviterName
        );
        results.sent.push(email);
      } catch (error) {
        console.error(`Failed to send invite to ${email}:`, error);
        results.failed.push({
          email,
          error: 'Failed to send email',
        });
      }
    }

    // Increment usage counter for successfully sent emails
    if (results.sent.length > 0) {
      await incrementEmailInviteUsage(unionId, results.sent.length);
    }

    return NextResponse.json({
      success: true,
      sent: results.sent.length,
      failed: results.failed.length,
      invalidEmails: invalidEmails.length > 0 ? invalidEmails : undefined,
      failedEmails: results.failed.length > 0 ? results.failed : undefined,
    });
  } catch (error) {
    console.error('Error sending email invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get invite capability info (whether user can bulk invite)
export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '');

    if (isNaN(unionId)) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionId),
          eq(members.userId, user.id),
          eq(members.status, 'approved')
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Get union info
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Check subscription status
    const isPaid = isPaidSubscription(union);

    // Return capability info (don't reveal exact limits)
    return NextResponse.json({
      success: true,
      canBulkInvite: isPaid,
    });
  } catch (error) {
    console.error('Error checking invite capability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
