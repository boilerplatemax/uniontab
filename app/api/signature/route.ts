import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET: Fetch current user's signature for a given union
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, parseInt(unionId))
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      signatureHtml: membership.signatureHtml,
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}

// PUT: Update/save signature
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { signatureHtml, unionId } = body;

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    if (typeof signatureHtml !== 'string') {
      return NextResponse.json(
        { error: 'Signature HTML is required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can manage signatures' },
        { status: 403 }
      );
    }

    // Enforce a max length to prevent abuse (10KB of HTML is generous)
    if (signatureHtml.length > 10000) {
      return NextResponse.json(
        { error: 'Signature is too long' },
        { status: 400 }
      );
    }

    // Update the member's signature
    // Note: HTML sanitization happens client-side via RichTextContent (uses DOMPurify)
    // We don't sanitize server-side because isomorphic-dompurify requires jsdom which
    // is incompatible with Next.js server builds
    await db
      .update(members)
      .set({ signatureHtml })
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      );

    return NextResponse.json({
      success: true,
      signatureHtml,
    });
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json(
      { error: 'Failed to update signature' },
      { status: 500 }
    );
  }
}

// DELETE: Clear signature
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unionId } = body;

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can manage signatures' },
        { status: 403 }
      );
    }

    // Clear the signature
    await db
      .update(members)
      .set({ signatureHtml: null })
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Signature deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting signature:', error);
    return NextResponse.json(
      { error: 'Failed to delete signature' },
      { status: 500 }
    );
  }
}
