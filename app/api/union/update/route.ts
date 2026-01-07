import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

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
      aboutImages,
      theme,
      themeColor,
      socialLinks,
      showSocialInHeader,
    } = body;

    // Update the union
    const [updatedUnion] = await db
      .update(unions)
      .set({
        publicName: publicName || null,
        logoUrl: logoUrl || null,
        coverPhotoUrl: coverPhotoUrl || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        description: description || null,
        about: about || null,
        aboutImages: aboutImages || null,
        theme: theme || 'default',
        themeColor: themeColor || '#2563eb',
        socialLinks: socialLinks || null,
        showSocialInHeader: showSocialInHeader ?? false,
      })
      .where(eq(unions.id, membership.unionId))
      .returning();

    // Revalidate the union page to show updated content immediately
    if (updatedUnion?.slug) {
      // Revalidate the main union page and all nested paths
      revalidatePath(`/${updatedUnion.slug}`, 'page');
      revalidatePath(`/${updatedUnion.slug}/settings`, 'page');
      // Also revalidate with layout to ensure full page refresh
      revalidatePath(`/${updatedUnion.slug}`, 'layout');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating union:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
