import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { dues, members, duesAuditLog } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PATCH(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      duesId,
      amount,
      dueDate,
      paymentStatus,
      paidAmount,
      paidDate,
      paymentMethod,
      checkNumber,
      notes,
      isWaived,
      waiverReason
    } = await request.json();

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
        { error: 'Only union owners and admins can update dues records' },
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    if (amount !== undefined) updateData.amount = amount;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (checkNumber !== undefined) updateData.checkNumber = checkNumber;
    if (notes !== undefined) updateData.notes = notes;

    // Handle waiver
    if (isWaived !== undefined) {
      updateData.isWaived = isWaived;
      if (isWaived) {
        updateData.waiverReason = waiverReason;
        updateData.waivedBy = user.id;
        updateData.waivedAt = new Date();
      } else {
        updateData.waiverReason = null;
        updateData.waivedBy = null;
        updateData.waivedAt = null;
      }
    }

    // Update the dues record
    const [updatedDues] = await db
      .update(dues)
      .set(updateData)
      .where(eq(dues.id, duesId))
      .returning();

    // Update member delinquency status
    // Get all unpaid/overdue dues for the member
    const memberDues = await db
      .select()
      .from(dues)
      .where(eq(dues.memberId, existingDues.memberId));

    const hasOverdueDues = memberDues.some(d =>
      d.paymentStatus === 'unpaid' && new Date(d.dueDate) < new Date()
    );

    // Update member delinquency status
    const [targetMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, existingDues.memberId))
      .limit(1);

    if (targetMember) {
      if (hasOverdueDues && !targetMember.isDelinquent) {
        await db
          .update(members)
          .set({
            isDelinquent: true,
            delinquentSince: new Date(),
          })
          .where(eq(members.id, existingDues.memberId));
      } else if (!hasOverdueDues && targetMember.isDelinquent) {
        await db
          .update(members)
          .set({
            isDelinquent: false,
            delinquentSince: null,
          })
          .where(eq(members.id, existingDues.memberId));
      }
    }

    // Create audit log entry
    const changes = [];
    if (amount !== undefined && amount !== existingDues.amount) {
      changes.push(`Amount: $${existingDues.amount / 100} → $${amount / 100}`);
    }
    if (paymentStatus !== undefined && paymentStatus !== existingDues.paymentStatus) {
      changes.push(`Status: ${existingDues.paymentStatus} → ${paymentStatus}`);
    }
    if (paidAmount !== undefined && paidAmount !== existingDues.paidAmount) {
      changes.push(`Paid: $${existingDues.paidAmount / 100} → $${paidAmount / 100}`);
    }
    if (isWaived && !existingDues.isWaived) {
      changes.push(`Waived: ${waiverReason}`);
    }

    if (changes.length > 0) {
      await db.insert(duesAuditLog).values({
        entityType: isWaived ? 'waiver' : 'payment',
        entityId: duesId,
        action: 'updated',
        changesSummary: changes.join('; '),
        previousValue: JSON.stringify({
          amount: existingDues.amount,
          paymentStatus: existingDues.paymentStatus,
          paidAmount: existingDues.paidAmount,
          isWaived: existingDues.isWaived,
        }),
        newValue: JSON.stringify({
          amount,
          paymentStatus,
          paidAmount,
          isWaived,
        }),
        performedBy: user.id,
        memberId: existingDues.memberId,
        unionId: existingDues.unionId,
      });
    }

    return NextResponse.json({ success: true, dues: updatedDues });
  } catch (error) {
    console.error('Error updating dues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
