import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { documentCollections, documentCollectionFiles, members, users } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// GET: List document collections for a union
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json({ error: 'unionId is required' }, { status: 400 });
    }

    const collections = await db
      .select({
        id: documentCollections.id,
        unionId: documentCollections.unionId,
        name: documentCollections.name,
        description: documentCollections.description,
        isPrivate: documentCollections.isPrivate,
        sortOrder: documentCollections.sortOrder,
        createdAt: documentCollections.createdAt,
        updatedAt: documentCollections.updatedAt,
        createdBy: { name: users.name },
      })
      .from(documentCollections)
      .innerJoin(users, eq(documentCollections.createdBy, users.id))
      .where(eq(documentCollections.unionId, parseInt(unionId)))
      .orderBy(asc(documentCollections.sortOrder));

    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Error fetching document collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new document collection
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unionId, name, description, isPrivate } = body;

    if (!unionId || !name) {
      return NextResponse.json({ error: 'unionId and name are required' }, { status: 400 });
    }

    // Verify user is owner or admin
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [collection] = await db
      .insert(documentCollections)
      .values({
        unionId,
        name,
        description: description || null,
        isPrivate: isPrivate ?? false,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error creating document collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a document collection
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, unionId, name, description, isPrivate, sortOrder } = body;

    if (!id || !unionId) {
      return NextResponse.json({ error: 'id and unionId are required' }, { status: 400 });
    }

    // Verify user is owner or admin
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [collection] = await db
      .update(documentCollections)
      .set(updateData)
      .where(
        and(
          eq(documentCollections.id, id),
          eq(documentCollections.unionId, unionId)
        )
      )
      .returning();

    return NextResponse.json({ collection });
  } catch (error) {
    console.error('Error updating document collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a document collection
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const unionId = searchParams.get('unionId');

    if (!id || !unionId) {
      return NextResponse.json({ error: 'id and unionId are required' }, { status: 400 });
    }

    // Verify user is owner or admin
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, parseInt(unionId))
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db
      .delete(documentCollections)
      .where(
        and(
          eq(documentCollections.id, parseInt(id)),
          eq(documentCollections.unionId, parseInt(unionId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
