import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { dues, members, duesReceipts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

/**
 * Generate a unique receipt number
 * Format: RECEIPT-{UNION_ID}-{YEAR}-{SEQUENTIAL_NUMBER}
 */
async function generateReceiptNumber(unionId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RECEIPT-${unionId}-${year}-`;

  // Get the latest receipt number for this union and year
  const latestReceipt = await db
    .select()
    .from(duesReceipts)
    .where(eq(duesReceipts.unionId, unionId))
    .orderBy(duesReceipts.generatedAt)
    .limit(1);

  let sequentialNumber = 1;

  if (latestReceipt.length > 0 && latestReceipt[0].receiptNumber.startsWith(prefix)) {
    const parts = latestReceipt[0].receiptNumber.split('-');
    const lastNumber = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNumber)) {
      sequentialNumber = lastNumber + 1;
    }
  }

  return `${prefix}${sequentialNumber.toString().padStart(6, '0')}`;
}

export async function POST(request: Request) {
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

    // Get the dues record
    const [duesRecord] = await db
      .select()
      .from(dues)
      .where(eq(dues.id, duesId))
      .limit(1);

    if (!duesRecord) {
      return NextResponse.json(
        { error: 'Dues record not found' },
        { status: 404 }
      );
    }

    // Check if the dues has been paid
    if (duesRecord.paymentStatus === 'unpaid') {
      return NextResponse.json(
        { error: 'Cannot generate receipt for unpaid dues' },
        { status: 400 }
      );
    }

    // Check if user is an owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, duesRecord.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can generate receipts' },
        { status: 403 }
      );
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(duesRecord.unionId);

    // Create the receipt
    const [newReceipt] = await db
      .insert(duesReceipts)
      .values({
        duesId: duesRecord.id,
        memberId: duesRecord.memberId,
        unionId: duesRecord.unionId,
        receiptNumber,
        amount: duesRecord.paidAmount,
        generatedBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, receipt: newReceipt });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
