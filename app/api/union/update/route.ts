import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { normalizeUrl } from '@/lib/utils';

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's union where they are owner
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.role, 'owner')
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Only union owners can update union info' }, { status: 403 });
    }

    const body = await request.json();
    const {
      publicName,
      logoUrl,
      coverPhotoUrl,
      email,
      phone,
      address,
      website,
      description,
      about,
      theme,
    } = body;

    // Update the union
    await db
      .update(unions)
      .set({
        publicName: publicName || null,
        logoUrl: logoUrl || null,
        coverPhotoUrl: coverPhotoUrl || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: normalizeUrl(website),
        description: description || null,
        about: about || null,
        theme: theme || 'default',
      })
      .where(eq(unions.id, membership.unionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating union:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
