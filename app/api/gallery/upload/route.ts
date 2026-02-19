import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin or owner
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.status, 'approved')
        )
      )
      .limit(1);

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden: admin or owner access required' }, { status: 403 });
    }

    const body = await request.json();
    const { url, name, type, size } = body;

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
    }

    // Get the current max sortOrder for this union's gallery
    const [maxOrder] = await db
      .select({ value: max(files.sortOrder) })
      .from(files)
      .where(
        and(
          eq(files.unionId, membership.unionId),
          eq(files.category, 'gallery')
        )
      );

    const nextOrder = (maxOrder?.value ?? -1) + 1;

    const [file] = await db
      .insert(files)
      .values({
        unionId: membership.unionId,
        name: name,
        originalName: name,
        fileUrl: url,
        fileType: type || 'unknown',
        fileSize: size || 0,
        isPrivate: false,
        category: 'gallery',
        sortOrder: nextOrder,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('Error saving gallery image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
