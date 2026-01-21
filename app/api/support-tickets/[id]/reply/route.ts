import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  supportTickets,
  supportTicketReplies,
  supportTicketAttachments,
  members,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

// Add a reply to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await request.json();
    const { message, attachments } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get ticket
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access - user must be ticket creator, union admin/owner, or webmaster
    const isWebmaster = user.email === 'info@uniontab.com';
    const isTicketCreator = ticket.userId === user.id;

    let hasAccess = isWebmaster || isTicketCreator;

    if (!hasAccess) {
      const [membership] = await db
        .select()
        .from(members)
        .where(and(eq(members.unionId, ticket.unionId), eq(members.userId, user.id)))
        .limit(1);

      hasAccess = membership && (membership.role === 'owner' || membership.role === 'admin');
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create the reply
    const [reply] = await db
      .insert(supportTicketReplies)
      .values({
        ticketId,
        userId: user.id,
        message,
        isStaffReply: isWebmaster,
      })
      .returning();

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      await db.insert(supportTicketAttachments).values(
        attachments.map((att: any) => ({
          ticketId,
          replyId: reply.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize,
          uploadedBy: user.id,
        }))
      );
    }

    // Update ticket status based on who replied
    const newStatus = isWebmaster ? 'awaiting_response' : 'open';
    await db
      .update(supportTickets)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Error adding reply to support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}
