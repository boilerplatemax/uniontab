import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { url, name, type, size } = body;

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
    }

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
        category: 'media-library',
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('Error saving media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
