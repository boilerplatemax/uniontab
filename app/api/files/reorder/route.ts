import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUpdates } = await request.json();

    if (!fileUpdates || !Array.isArray(fileUpdates) || fileUpdates.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the first file to check union ownership
    const fileIds = fileUpdates.map((update: any) => update.fileId);
    const [firstFile] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileIds[0]))
      .limit(1);

    if (!firstFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, firstFile.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can modify files' },
        { status: 403 }
      );
    }

    // Update all files in batch
    const updatePromises = fileUpdates.map((update: any) => {
      const updateData: any = {};
      if (update.sortOrder !== undefined) {
        updateData.sortOrder = update.sortOrder;
      }
      if (update.category !== undefined) {
        updateData.category = update.category || null;
      }

      return db
        .update(files)
        .set(updateData)
        .where(eq(files.id, update.fileId))
        .returning();
    });

    const results = await Promise.all(updatePromises);
    const updatedFiles = results.map(([file]) => file);

    return NextResponse.json({ success: true, files: updatedFiles });
  } catch (error) {
    console.error('Error reordering files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
