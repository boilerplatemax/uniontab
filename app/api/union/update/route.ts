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

    // Only update fields that are explicitly provided in the request body
    // This prevents partial updates (e.g. editing about) from wiping other fields
    const updateData: Record<string, any> = {};

    if ('publicName' in body) updateData.publicName = body.publicName || null;
    if ('logoUrl' in body) updateData.logoUrl = body.logoUrl || null;
    if ('coverPhotoUrl' in body) updateData.coverPhotoUrl = body.coverPhotoUrl || null;
    if ('email' in body) updateData.email = body.email || null;
    if ('phone' in body) updateData.phone = body.phone || null;
    if ('address' in body) updateData.address = body.address || null;
    if ('website' in body) updateData.website = body.website || null;
    if ('description' in body) updateData.description = body.description || null;
    if ('about' in body) updateData.about = body.about || null;
    if ('aboutImages' in body) updateData.aboutImages = body.aboutImages || null;
    if ('aboutImageUrl' in body) updateData.aboutImageUrl = body.aboutImageUrl || null;
    if ('aboutImagePosition' in body) updateData.aboutImagePosition = body.aboutImagePosition || 'above';
    if ('theme' in body) updateData.theme = body.theme || 'default';
    if ('themeColor' in body) updateData.themeColor = body.themeColor || '#2563eb';
    if ('socialLinks' in body) updateData.socialLinks = body.socialLinks || null;
    if ('showSocialInHeader' in body) updateData.showSocialInHeader = body.showSocialInHeader ?? false;
    if ('showSocialInHero' in body) updateData.showSocialInHero = body.showSocialInHero ?? true;
    if ('hidePoweredBy' in body) updateData.hidePoweredBy = body.hidePoweredBy ?? false;
    if ('defaultLanguage' in body) updateData.defaultLanguage = body.defaultLanguage || 'en';

    // Update the union with only the provided fields
    const [updatedUnion] = await db
      .update(unions)
      .set(updateData)
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
