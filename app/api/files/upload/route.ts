import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { checkStorageLimit, incrementStorageUsage, formatBytes } from '@/lib/storage/limits';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, name, originalName, fileUrl, fileType, fileSize, isPrivate, category } =
      await request.json();

    if (!unionId || !name || !originalName || !fileUrl || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can upload files' },
        { status: 403 }
      );
    }

    // Check storage limits before uploading
    const storageCheck = await checkStorageLimit(unionId, fileSize);

    if (!storageCheck.canUpload) {
      return NextResponse.json(
        {
          error: 'Storage limit exceeded',
          details: {
            fileSize: formatBytes(fileSize),
            used: formatBytes(storageCheck.used),
            limit: formatBytes(storageCheck.limit),
            remaining: formatBytes(storageCheck.remaining),
            message: `This file (${formatBytes(fileSize)}) would exceed your storage limit. You have ${formatBytes(storageCheck.remaining)} remaining of ${formatBytes(storageCheck.limit)}.`
          }
        },
        { status: 413 } // 413 Payload Too Large
      );
    }

    // Create the file record
    const [newFile] = await db
      .insert(files)
      .values({
        unionId,
        name,
        originalName,
        fileUrl,
        fileType,
        fileSize,
        isPrivate: isPrivate || false,
        category: category || null,
        createdBy: user.id,
      })
      .returning();

    // Increment storage usage
    await incrementStorageUsage(unionId, fileSize);

    return NextResponse.json({ success: true, file: newFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
