import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { normalizeUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithUnion = await getUserWithTeam(user.id);
    if (!userWithUnion?.unionId) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Update the union with onboarding data
    await db
      .update(unions)
      .set({
        publicName: data.publicName || null,
        logoUrl: data.logoUrl || null,
        coverPhotoUrl: data.coverPhotoUrl || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        website: normalizeUrl(data.website),
        description: data.description || null,
        about: data.about || null,
        updatedAt: new Date()
      })
      .where(eq(unions.id, userWithUnion.unionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}
