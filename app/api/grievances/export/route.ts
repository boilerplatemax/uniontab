import { NextResponse } from 'next/server';
import { getUser, getGrievancesForUnion } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');

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
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can export grievances' },
        { status: 403 }
      );
    }

    // Get all grievances for the union
    const grievances = await getGrievancesForUnion(unionId);

    // Generate CSV
    const headers = [
      'ID',
      'Title',
      'Status',
      'Priority',
      'Category',
      'Member Name',
      'Member Email',
      'Assigned To',
      'Created At',
      'Updated At',
      'Resolved At',
      'Closed At',
      'Resolution Outcome'
    ];

    const rows = grievances.map(g => [
      g.id,
      `"${g.title.replace(/"/g, '""')}"`,
      g.status,
      g.priority || '',
      g.category || '',
      g.member?.user?.name || '',
      g.member?.user?.email || '',
      g.assignedTo?.name || '',
      g.createdAt?.toISOString() || '',
      g.updatedAt?.toISOString() || '',
      g.resolvedAt?.toISOString() || '',
      g.closedAt?.toISOString() || '',
      g.resolutionOutcome || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="grievances-${unionId}-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting grievances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
