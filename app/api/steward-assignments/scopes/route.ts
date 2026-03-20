import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { hasPermission } from '@/lib/admin-permissions';

// GET - Get distinct scope values for admin dropdowns
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');

    if (!unionId) {
      return NextResponse.json({ error: 'Union ID is required' }, { status: 400 });
    }

    // Check admin permissions
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || !hasPermission(membership.role, membership.adminPermissions, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get distinct values for each scope type from member records
    const [bargainingUnits, departments, subUnits] = await Promise.all([
      db
        .selectDistinct({ value: members.bargainingUnit })
        .from(members)
        .where(and(
          eq(members.unionId, unionId),
          eq(members.status, 'approved'),
          isNotNull(members.bargainingUnit),
          sql`${members.bargainingUnit} != ''`
        )),
      db
        .selectDistinct({ value: members.department })
        .from(members)
        .where(and(
          eq(members.unionId, unionId),
          eq(members.status, 'approved'),
          isNotNull(members.department),
          sql`${members.department} != ''`
        )),
      db
        .selectDistinct({ value: members.subUnit })
        .from(members)
        .where(and(
          eq(members.unionId, unionId),
          eq(members.status, 'approved'),
          isNotNull(members.subUnit),
          sql`${members.subUnit} != ''`
        )),
    ]);

    return NextResponse.json({
      bargaining_unit: bargainingUnits.map(r => r.value).filter(Boolean).sort(),
      department: departments.map(r => r.value).filter(Boolean).sort(),
      sub_unit: subUnits.map(r => r.value).filter(Boolean).sort(),
    });
  } catch (error) {
    console.error('Error fetching scope values:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
