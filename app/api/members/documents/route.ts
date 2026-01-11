import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, memberDocuments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Create a new document
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, unionId, name, category, fileUrl, fileType, fileSize, notes } = body;

    if (!memberId || !unionId || !name || !fileUrl) {
      return NextResponse.json(
        { error: 'Member ID, Union ID, name, and file URL are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to add documents' },
        { status: 403 }
      );
    }

    // Create the document
    const [newDocument] = await db
      .insert(memberDocuments)
      .values({
        memberId,
        unionId,
        name,
        category: category || 'other',
        fileUrl,
        fileType: fileType || null,
        fileSize: fileSize || null,
        notes: notes || null,
        uploadedBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      document: newDocument,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, unionId } = body;

    if (!documentId || !unionId) {
      return NextResponse.json(
        { error: 'Document ID and Union ID are required' },
        { status: 400 }
      );
    }

    // Check if user is admin or owner of this union
    const [userMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!userMembership || (userMembership.role !== 'owner' && userMembership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'You do not have permission to delete documents' },
        { status: 403 }
      );
    }

    // Delete the document
    await db
      .delete(memberDocuments)
      .where(eq(memberDocuments.id, documentId));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
