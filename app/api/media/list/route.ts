import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
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

    // Get media files (files in the 'media' category)
    const mediaFiles = await db
      .select({
        id: files.id,
        url: files.fileUrl,
        name: files.name,
        type: files.fileType,
        size: files.fileSize,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(
        and(
          eq(files.unionId, membership.unionId),
          eq(files.category, 'media-library')
        )
      )
      .orderBy(desc(files.createdAt));

    return NextResponse.json({ files: mediaFiles });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
