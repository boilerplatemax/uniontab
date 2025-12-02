import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { users, members, unions } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();

    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all unions
    const allUnions = await db
      .select({
        id: unions.id,
        name: unions.name,
        slug: unions.slug
      })
      .from(unions)
      .where(isNull(unions.deletedAt));

    // Fetch all members with their union info
    const allMembers = await db
      .select({
        memberId: members.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        role: members.role,
        status: members.status,
        unionId: unions.id,
        unionName: unions.name,
        unionSlug: unions.slug,
        unionLogoUrl: unions.logoUrl,
        unionCoverPhotoUrl: unions.coverPhotoUrl
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .innerJoin(unions, eq(members.unionId, unions.id))
      .where(and(isNull(users.deletedAt), isNull(unions.deletedAt)));

    return NextResponse.json({
      members: allMembers,
      unions: allUnions
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
