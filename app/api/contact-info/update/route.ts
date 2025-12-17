import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionContactInfo, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      unionId,
      contactEmail,
      contactPhone,
      contactAddress,
      officeHours,
      contactFormEnabled,
      contactFormEmail,
    } = await request.json();

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can update contact info' },
        { status: 403 }
      );
    }

    // Check if contact info exists
    const [existingInfo] = await db
      .select()
      .from(unionContactInfo)
      .where(eq(unionContactInfo.unionId, unionId))
      .limit(1);

    let result;

    if (existingInfo) {
      // Update existing
      [result] = await db
        .update(unionContactInfo)
        .set({
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          contactAddress: contactAddress || null,
          officeHours: officeHours || null,
          contactFormEnabled: contactFormEnabled ?? true,
          contactFormEmail: contactFormEmail || null,
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(eq(unionContactInfo.id, existingInfo.id))
        .returning();
    } else {
      // Create new
      [result] = await db
        .insert(unionContactInfo)
        .values({
          unionId,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          contactAddress: contactAddress || null,
          officeHours: officeHours || null,
          contactFormEnabled: contactFormEnabled ?? true,
          contactFormEmail: contactFormEmail || null,
          updatedBy: user.id,
        })
        .returning();
    }

    return NextResponse.json({ success: true, contactInfo: result });
  } catch (error) {
    console.error('Error updating contact info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
