import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { duesReceipts, dues, members, users, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const receiptId = parseInt(id);

    if (isNaN(receiptId)) {
      return NextResponse.json(
        { error: 'Invalid receipt ID' },
        { status: 400 }
      );
    }

    // Fetch the receipt with all related data
    const [receiptResult] = await db
      .select({
        receiptId: duesReceipts.id,
        receiptNumber: duesReceipts.receiptNumber,
        receiptAmount: duesReceipts.amount,
        generatedAt: duesReceipts.generatedAt,
        generatedById: duesReceipts.generatedBy,
        duesAmount: dues.amount,
        dueDate: dues.dueDate,
        paymentMethod: dues.paymentMethod,
        checkNumber: dues.checkNumber,
        paidDate: dues.paidDate,
        duesNotes: dues.notes,
        userName: users.name,
        userEmail: users.email,
        memberMemberId: members.memberId,
        unionId: unions.id,
        unionName: unions.name,
        unionLocalNumber: unions.localNumber,
        unionAddress: unions.address,
        unionEmail: unions.email,
        unionPhone: unions.phone,
        unionLogoUrl: unions.logoUrl,
      })
      .from(duesReceipts)
      .innerJoin(dues, eq(duesReceipts.duesId, dues.id))
      .innerJoin(members, eq(duesReceipts.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(unions, eq(duesReceipts.unionId, unions.id))
      .where(eq(duesReceipts.id, receiptId))
      .limit(1);

    if (!receiptResult) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Get the user who generated the receipt
    const [generatedByUser] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, receiptResult.generatedById))
      .limit(1);

    // Check if user has access (must be owner/admin of the union, or the member themselves)
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, receiptResult.unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    const isOwnerOrAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');
    const isMember = membership && receiptResult.userEmail === user.email;

    if (!isOwnerOrAdmin && !isMember) {
      return NextResponse.json(
        { error: 'You do not have permission to view this receipt' },
        { status: 403 }
      );
    }

    // Structure the response
    const receiptData = {
      id: receiptResult.receiptId,
      receiptNumber: receiptResult.receiptNumber,
      amount: receiptResult.receiptAmount,
      generatedAt: receiptResult.generatedAt,
      dues: {
        amount: receiptResult.duesAmount,
        dueDate: receiptResult.dueDate,
        paymentMethod: receiptResult.paymentMethod,
        checkNumber: receiptResult.checkNumber,
        paidDate: receiptResult.paidDate,
        notes: receiptResult.duesNotes,
      },
      member: {
        user: {
          name: receiptResult.userName,
          email: receiptResult.userEmail,
        },
        memberId: receiptResult.memberMemberId,
      },
      union: {
        name: receiptResult.unionName,
        localNumber: receiptResult.unionLocalNumber,
        address: receiptResult.unionAddress,
        email: receiptResult.unionEmail,
        phone: receiptResult.unionPhone,
        logoUrl: receiptResult.unionLogoUrl,
      },
      generatedBy: {
        name: generatedByUser?.name || 'Unknown',
      },
    };

    return NextResponse.json({ receipt: receiptData });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
