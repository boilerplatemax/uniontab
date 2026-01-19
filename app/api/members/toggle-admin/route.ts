import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, unions } from '@/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// Admin limits per plan (owners + admins combined)
const ADMIN_LIMITS: Record<string, number> = {
  'Free': 2,      // Free tier - small taste of the feature
  'Base': 5,      // Base tier
  'Plus': 10,     // Plus tier
  'Pro': 999,     // Pro - effectively unlimited
  'Enterprise': 999, // Enterprise - effectively unlimited
};

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the member to check union ownership
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent modifying owners
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, memberToUpdate.unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can modify member roles' },
        { status: 403 }
      );
    }

    // If promoting to admin, check admin limits
    if (role === 'admin') {
      // Get the union's plan
      const [union] = await db
        .select({ planName: unions.planName })
        .from(unions)
        .where(eq(unions.id, memberToUpdate.unionId))
        .limit(1);

      const planName = union?.planName || 'Free';
      const adminLimit = ADMIN_LIMITS[planName] ?? ADMIN_LIMITS['Free'];

      // Count current admins and owners
      const currentAdmins = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.unionId, memberToUpdate.unionId),
            or(eq(members.role, 'admin'), eq(members.role, 'owner'))
          )
        );

      if (currentAdmins.length >= adminLimit) {
        return NextResponse.json(
          {
            error: `Admin limit reached for your plan. ${planName} plan allows up to ${adminLimit} admins/owners. Please upgrade your plan to add more admins.`,
            limitReached: true,
            currentCount: currentAdmins.length,
            limit: adminLimit,
            planName
          },
          { status: 403 }
        );
      }
    }

    // Update the member role
    await db
      .update(members)
      .set({ role })
      .where(eq(members.id, memberId));

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
