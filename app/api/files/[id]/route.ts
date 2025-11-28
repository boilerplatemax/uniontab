import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const fileId = parseInt(id);

    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    // Get the file
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, file.unionId),
          eq(members.userId, user.id),
          eq(members.role, 'owner')
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Only union owners can edit files' }, { status: 403 });
    }

    // Update the file
    const body = await request.json();
    const { originalName, isPrivate } = body;

    await db
      .update(files)
      .set({
        originalName,
        isPrivate,
      })
      .where(eq(files.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
