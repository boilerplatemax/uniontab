import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members, memberNotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Create a new note
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, unionId, content, noteType } = body;

    if (!memberId || !unionId || !content) {
      return NextResponse.json(
        { error: 'Member ID, Union ID, and content are required' },
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
        { error: 'You do not have permission to add notes' },
        { status: 403 }
      );
    }

    // Create the note
    const [newNote] = await db
      .insert(memberNotes)
      .values({
        memberId,
        unionId,
        content,
        noteType: noteType || 'general',
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// Update a note
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, unionId, content, noteType } = body;

    if (!noteId || !unionId || !content) {
      return NextResponse.json(
        { error: 'Note ID, Union ID, and content are required' },
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
        { error: 'You do not have permission to edit notes' },
        { status: 403 }
      );
    }

    // Update the note
    const [updatedNote] = await db
      .update(memberNotes)
      .set({
        content,
        noteType: noteType || 'general',
        updatedAt: new Date(),
      })
      .where(eq(memberNotes.id, noteId))
      .returning();

    return NextResponse.json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { noteId, unionId } = body;

    if (!noteId || !unionId) {
      return NextResponse.json(
        { error: 'Note ID and Union ID are required' },
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
        { error: 'You do not have permission to delete notes' },
        { status: 403 }
      );
    }

    // Delete the note
    await db
      .delete(memberNotes)
      .where(eq(memberNotes.id, noteId));

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
