import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import type { NavConfigItem } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { resolveNavConfig } from '@/lib/nav-config';

// GET: Retrieve nav config for a union
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json({ error: 'unionId is required' }, { status: 400 });
    }

    const [union] = await db
      .select({ navConfig: unions.navConfig })
      .from(unions)
      .where(eq(unions.id, parseInt(unionId)))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    const config = resolveNavConfig(union.navConfig);
    return NextResponse.json({ navConfig: config });
  } catch (error) {
    console.error('Error fetching nav config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update nav config for a union (owner/settings admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unionId, navConfig } = body as { unionId: number; navConfig: NavConfigItem[] };

    if (!unionId || !navConfig) {
      return NextResponse.json({ error: 'unionId and navConfig are required' }, { status: 400 });
    }

    // Check user is owner or admin with settings permission
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isOwner = membership.role === 'owner';
    const isSettingsAdmin = membership.role === 'admin' &&
      membership.adminPermissions &&
      (membership.adminPermissions as Record<string, boolean>).settings === true;

    if (!isOwner && !isSettingsAdmin) {
      return NextResponse.json({ error: 'Unauthorized - requires owner or settings permission' }, { status: 403 });
    }

    // Validate nav config items
    for (const item of navConfig) {
      if (!item.id || !item.label || !item.type) {
        return NextResponse.json({ error: 'Each nav item must have id, label, and type' }, { status: 400 });
      }
      if (!['built-in', 'page', 'collection', 'link'].includes(item.type)) {
        return NextResponse.json({ error: `Invalid nav item type: ${item.type}` }, { status: 400 });
      }
    }

    const [updatedUnion] = await db
      .update(unions)
      .set({ navConfig, updatedAt: new Date() })
      .where(eq(unions.id, unionId))
      .returning();

    if (updatedUnion?.slug) {
      revalidatePath(`/${updatedUnion.slug}`, 'layout');
    }

    return NextResponse.json({ success: true, navConfig });
  } catch (error) {
    console.error('Error updating nav config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
