import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members, navigationItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { decrementStorageUsage } from '@/lib/storage/limits';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { error: 'Missing file ID' },
        { status: 400 }
      );
    }

    // Get the file to check ownership
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, file.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can delete files' },
        { status: 403 }
      );
    }

    // Store file size before deletion for storage tracking
    const fileSize = file.fileSize;
    const unionId = file.unionId;

    // Clean up any navigation items linking to this file
    await db
      .update(navigationItems)
      .set({ fileId: null, isEnabled: false, updatedAt: new Date() })
      .where(eq(navigationItems.fileId, fileId));

    // Delete the file
    await db.delete(files).where(eq(files.id, fileId));

    // Decrement storage usage
    await decrementStorageUsage(unionId, fileSize);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
