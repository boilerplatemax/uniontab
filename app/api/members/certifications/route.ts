import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, memberCertifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Create a new certification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, unionId, name, type, issuingBody, completedDate, expiryDate, notes } = body;

    if (!memberId || !unionId || !name) {
      return NextResponse.json(
        { error: 'Member ID, Union ID, and name are required' },
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
        { error: 'You do not have permission to add certifications' },
        { status: 403 }
      );
    }

    // Determine status based on expiry date
    let status = 'valid';
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        status = 'expired';
      }
    }

    // Create the certification
    const [newCertification] = await db
      .insert(memberCertifications)
      .values({
        memberId,
        unionId,
        name,
        type: type || null,
        issuingBody: issuingBody || null,
        completedDate: completedDate ? new Date(completedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        notes: notes || null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      certification: newCertification,
    });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { error: 'Failed to create certification' },
      { status: 500 }
    );
  }
}

// Update a certification
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificationId, unionId, name, type, issuingBody, completedDate, expiryDate, notes } = body;

    if (!certificationId || !unionId || !name) {
      return NextResponse.json(
        { error: 'Certification ID, Union ID, and name are required' },
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
        { error: 'You do not have permission to edit certifications' },
        { status: 403 }
      );
    }

    // Determine status based on expiry date
    let status = 'valid';
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        status = 'expired';
      }
    }

    // Update the certification
    const [updatedCertification] = await db
      .update(memberCertifications)
      .set({
        name,
        type: type || null,
        issuingBody: issuingBody || null,
        completedDate: completedDate ? new Date(completedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(memberCertifications.id, certificationId))
      .returning();

    return NextResponse.json({
      success: true,
      certification: updatedCertification,
    });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}

// Delete a certification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { certificationId, unionId } = body;

    if (!certificationId || !unionId) {
      return NextResponse.json(
        { error: 'Certification ID and Union ID are required' },
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
        { error: 'You do not have permission to delete certifications' },
        { status: 403 }
      );
    }

    // Delete the certification
    await db
      .delete(memberCertifications)
      .where(eq(memberCertifications.id, certificationId));

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      { error: 'Failed to delete certification' },
      { status: 500 }
    );
  }
}
