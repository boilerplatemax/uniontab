import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, users, stewardAssignments } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET - Find the steward(s) assigned to the current member's scope(s)
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

    // Get the current member's record
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 });
    }

    // Build scope conditions from the member's fields
    const scopeConditions = [];

    if (membership.bargainingUnit) {
      scopeConditions.push(
        and(
          eq(stewardAssignments.scopeType, 'bargaining_unit'),
          eq(stewardAssignments.scopeValue, membership.bargainingUnit)
        )
      );
    }

    if (membership.department) {
      scopeConditions.push(
        and(
          eq(stewardAssignments.scopeType, 'department'),
          eq(stewardAssignments.scopeValue, membership.department)
        )
      );
    }

    if (membership.subUnit) {
      scopeConditions.push(
        and(
          eq(stewardAssignments.scopeType, 'sub_unit'),
          eq(stewardAssignments.scopeValue, membership.subUnit)
        )
      );
    }

    if (scopeConditions.length === 0) {
      return NextResponse.json([]);
    }

    const stewards = await db
      .select({
        id: stewardAssignments.id,
        scopeType: stewardAssignments.scopeType,
        scopeValue: stewardAssignments.scopeValue,
        memberId: stewardAssignments.memberId,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.personalEmail,
        memberPhone: members.cellPhone,
        memberProfilePhotoUrl: members.profilePhotoUrl,
        userName: users.name,
        userEmail: users.email,
      })
      .from(stewardAssignments)
      .innerJoin(members, eq(stewardAssignments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(
        eq(stewardAssignments.unionId, unionId),
        or(...scopeConditions)
      ));

    return NextResponse.json(stewards);
  } catch (error) {
    console.error('Error fetching my steward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
