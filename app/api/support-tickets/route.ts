import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { supportTickets, supportTicketAttachments, unions, users, members } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';

// Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { unionId, subject, description, category, attachments } = body;

    // Validate required fields
    if (!unionId || !subject || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user is an admin/owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union admins and owners can create support tickets' },
        { status: 403 }
      );
    }

    // Create the ticket
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        unionId,
        userId: user.id,
        subject,
        description,
        category,
        status: 'open',
        priority: 'normal',
      })
      .returning();

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      await db.insert(supportTicketAttachments).values(
        attachments.map((att: any) => ({
          ticketId: ticket.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize,
          uploadedBy: user.id,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

// Get support tickets
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    // If unionId is provided, get tickets for that union (admin view)
    if (unionId) {
      const [membership] = await db
        .select()
        .from(members)
        .where(and(eq(members.unionId, parseInt(unionId)), eq(members.userId, user.id)))
        .limit(1);

      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      const tickets = await db
        .select({
          id: supportTickets.id,
          subject: supportTickets.subject,
          description: supportTickets.description,
          category: supportTickets.category,
          status: supportTickets.status,
          priority: supportTickets.priority,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          resolvedAt: supportTickets.resolvedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(supportTickets)
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .where(eq(supportTickets.unionId, parseInt(unionId)))
        .orderBy(desc(supportTickets.createdAt));

      return NextResponse.json({ tickets });
    }

    // Check if user is webmaster (info@uniontab.com)
    if (user.email === 'info@uniontab.com') {
      // Webmaster can see all tickets
      const tickets = await db
        .select({
          id: supportTickets.id,
          unionId: supportTickets.unionId,
          subject: supportTickets.subject,
          description: supportTickets.description,
          category: supportTickets.category,
          status: supportTickets.status,
          priority: supportTickets.priority,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          resolvedAt: supportTickets.resolvedAt,
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
        .orderBy(desc(supportTickets.createdAt));

      return NextResponse.json({ tickets, isWebmaster: true });
    }

    // Regular user - get their own tickets
    const tickets = await db
      .select({
        id: supportTickets.id,
        unionId: supportTickets.unionId,
        subject: supportTickets.subject,
        description: supportTickets.description,
        category: supportTickets.category,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        unionName: unions.name,
        unionSlug: unions.slug,
      })
      .from(supportTickets)
      .innerJoin(unions, eq(supportTickets.unionId, unions.id))
      .where(eq(supportTickets.userId, user.id))
      .orderBy(desc(supportTickets.createdAt));

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}
