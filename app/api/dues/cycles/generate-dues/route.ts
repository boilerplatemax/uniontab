import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { duesCycles, dues, members, duesAuditLog } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cycleId } = await request.json();

    if (!cycleId) {
      return NextResponse.json(
        { error: 'Missing cycleId' },
        { status: 400 }
      );
    }

    // Get the cycle
    const [cycle] = await db
      .select()
      .from(duesCycles)
      .where(eq(duesCycles.id, cycleId))
      .limit(1);

    if (!cycle) {
      return NextResponse.json(
        { error: 'Cycle not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, cycle.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can generate dues' },
        { status: 403 }
      );
    }

    // Get all approved members in the union
    const unionMembers = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, cycle.unionId),
        eq(members.status, 'approved')
      ));

    // Generate dues for each member
    const createdDues = [];
    for (const member of unionMembers) {
      const [newDues] = await db
        .insert(dues)
        .values({
          memberId: member.id,
          unionId: cycle.unionId,
          cycleId: cycle.id,
          amount: cycle.amountDue,
          dueDate: cycle.dueDate,
          paymentStatus: 'unpaid',
          paidAmount: 0,
          createdBy: user.id,
        })
        .returning();

      createdDues.push(newDues);

      // Create audit log entry
      await db.insert(duesAuditLog).values({
        entityType: 'cycle',
        entityId: newDues.id,
        action: 'created',
        changesSummary: `Dues generated from cycle: ${cycle.name}`,
        newValue: JSON.stringify({
          cycleId: cycle.id,
          cycleName: cycle.name,
          amount: cycle.amountDue,
          dueDate: cycle.dueDate,
        }),
        performedBy: user.id,
        memberId: member.id,
        unionId: cycle.unionId,
      });
    }

    // Update cycle status to active
    await db
      .update(duesCycles)
      .set({ status: 'active' })
      .where(eq(duesCycles.id, cycleId));

    return NextResponse.json({
      success: true,
      message: `Generated ${createdDues.length} dues records`,
      count: createdDues.length,
    });
  } catch (error) {
    console.error('Error generating dues from cycle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
