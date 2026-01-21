import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  supportTickets,
  supportTicketReplies,
  supportTicketAttachments,
  unions,
  users,
  members,
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

// Get a specific ticket with replies
export async function GET(
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

    // Get ticket
    const [ticket] = await db
      .select({
        id: supportTickets.id,
        unionId: supportTickets.unionId,
        userId: supportTickets.userId,
        subject: supportTickets.subject,
        description: supportTickets.description,
        category: supportTickets.category,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
        userName: users.name,
        userEmail: users.email,
        unionName: unions.name,
        unionSlug: unions.slug,
        unionLocalNumber: unions.localNumber,
        unionPublicName: unions.publicName,
      })
      .from(supportTickets)
      .innerJoin(users, eq(supportTickets.userId, users.id))
      .innerJoin(unions, eq(supportTickets.unionId, unions.id))
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

    // Get replies
    const replies = await db
      .select({
        id: supportTicketReplies.id,
        message: supportTicketReplies.message,
        isStaffReply: supportTicketReplies.isStaffReply,
        createdAt: supportTicketReplies.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(supportTicketReplies)
      .innerJoin(users, eq(supportTicketReplies.userId, users.id))
      .where(eq(supportTicketReplies.ticketId, ticketId))
      .orderBy(supportTicketReplies.createdAt);

    // Get attachments for ticket
    const ticketAttachments = await db
      .select()
      .from(supportTicketAttachments)
      .where(and(
        eq(supportTicketAttachments.ticketId, ticketId),
        eq(supportTicketAttachments.replyId, null as any)
      ));

    // Get attachments for each reply
    const replyIds = replies.map(r => r.id);
    const replyAttachments = replyIds.length > 0
      ? await db
          .select()
          .from(supportTicketAttachments)
          .where(eq(supportTicketAttachments.ticketId, ticketId))
      : [];

    return NextResponse.json({
      ticket: {
        ...ticket,
        attachments: ticketAttachments,
      },
      replies: replies.map(reply => ({
        ...reply,
        attachments: replyAttachments.filter(a => a.replyId === reply.id),
      })),
      isWebmaster,
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

// Update ticket status
export async function PATCH(
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
    const { status, priority } = body;

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

    // Only webmaster can update status/priority
    const isWebmaster = user.email === 'info@uniontab.com';
    if (!isWebmaster) {
      return NextResponse.json(
        { error: 'Only support staff can update ticket status' },
        { status: 403 }
      );
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolvedAt = new Date();
      } else if (status === 'closed') {
        updates.closedAt = new Date();
      }
    }

    if (priority) {
      updates.priority = priority;
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
