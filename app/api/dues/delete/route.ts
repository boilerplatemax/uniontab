import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { dues, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function DELETE(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { duesId } = await request.json();

    if (!duesId) {
      return NextResponse.json(
        { error: 'Missing duesId' },
        { status: 400 }
      );
    }

    // Get the existing dues record
    const [existingDues] = await db
      .select()
      .from(dues)
      .where(eq(dues.id, duesId))
      .limit(1);

    if (!existingDues) {
      return NextResponse.json(
        { error: 'Dues record not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, existingDues.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can delete dues records' },
        { status: 403 }
      );
    }

    // Delete the dues record (cascades to receipts)
    await db
      .delete(dues)
      .where(eq(dues.id, duesId));

    // Update member delinquency status
    // Get remaining unpaid/overdue dues for the member
    const remainingDues = await db
      .select()
      .from(dues)
      .where(eq(dues.memberId, existingDues.memberId));

    const hasOverdueDues = remainingDues.some(d =>
      d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date()
    );

    // Update member delinquency status if no more overdue dues
    if (!hasOverdueDues) {
      await db
        .update(members)
        .set({
          isDelinquent: false,
          delinquentSince: null,
        })
        .where(eq(members.id, existingDues.memberId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
