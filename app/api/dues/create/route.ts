import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { dues, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      memberId,
      unionId,
      amount,
      dueDate,
      paymentStatus,
      paidAmount,
      paidDate,
      paymentMethod,
      checkNumber,
      notes
    } = await request.json();

    if (!memberId || !unionId || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields (memberId, unionId, amount, dueDate)' },
        { status: 400 }
      );
    }

    // Check if user is an owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can create dues records' },
        { status: 403 }
      );
    }

    // Validate the member belongs to the union
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.unionId, unionId)))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found in this union' },
        { status: 404 }
      );
    }

    // Create the dues record
    const [newDues] = await db
      .insert(dues)
      .values({
        memberId,
        unionId,
        amount,
        dueDate: new Date(dueDate),
        paymentStatus: paymentStatus || 'unpaid',
        paidAmount: paidAmount || 0,
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMethod: paymentMethod || null,
        checkNumber: checkNumber || null,
        notes: notes || null,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();

    // Update member delinquency status if unpaid and past due
    if (paymentStatus === 'unpaid' || !paymentStatus) {
      const isPastDue = new Date(dueDate) < new Date();
      if (isPastDue && !targetMember.isDelinquent) {
        await db
          .update(members)
          .set({
            isDelinquent: true,
            delinquentSince: new Date(),
          })
          .where(eq(members.id, memberId));
      }
    }

    return NextResponse.json({ success: true, dues: newDues });
  } catch (error) {
    console.error('Error creating dues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
