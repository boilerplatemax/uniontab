import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { documentCollections, documentCollectionFiles, members, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// GET: List files in a collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
    }

    const files = await db
      .select({
        id: documentCollectionFiles.id,
        collectionId: documentCollectionFiles.collectionId,
        name: documentCollectionFiles.name,
        fileUrl: documentCollectionFiles.fileUrl,
        fileType: documentCollectionFiles.fileType,
        fileSize: documentCollectionFiles.fileSize,
        sortOrder: documentCollectionFiles.sortOrder,
        createdAt: documentCollectionFiles.createdAt,
        uploadedBy: { name: users.name },
      })
      .from(documentCollectionFiles)
      .innerJoin(users, eq(documentCollectionFiles.uploadedBy, users.id))
      .where(eq(documentCollectionFiles.collectionId, parseInt(collectionId)))
      .orderBy(asc(documentCollectionFiles.sortOrder));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error fetching collection files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add a file to a collection
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { collectionId, name, fileUrl, fileType, fileSize } = body;

    if (!collectionId || !name || !fileUrl) {
      return NextResponse.json({ error: 'collectionId, name, and fileUrl are required' }, { status: 400 });
    }

    // Verify user has access to the collection's union
    const [collection] = await db
      .select()
      .from(documentCollections)
      .where(eq(documentCollections.id, collectionId))
      .limit(1);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, collection.unionId)
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [file] = await db
      .insert(documentCollectionFiles)
      .values({
        collectionId,
        name,
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize || null,
        uploadedBy: user.id,
      })
      .returning();

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Error adding file to collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a file from a collection
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    // Get the file and its collection to verify access
    const [file] = await db
      .select()
      .from(documentCollectionFiles)
      .where(eq(documentCollectionFiles.id, parseInt(fileId)))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const [collection] = await db
      .select()
      .from(documentCollections)
      .where(eq(documentCollections.id, file.collectionId))
      .limit(1);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, collection.unionId)
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db
      .delete(documentCollectionFiles)
      .where(eq(documentCollectionFiles.id, parseInt(fileId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
