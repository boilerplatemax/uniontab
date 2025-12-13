import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, strikeResources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await context.params;
    const resourceIdNum = parseInt(resourceId);

    if (isNaN(resourceIdNum)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 });
    }

    const {
      title,
      description,
      resourceType,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      externalUrl,
      category,
      sortOrder,
      isPrivate
    } = await request.json();

    // Get resource with strike info
    const resource = await db.query.strikeResources.findFirst({
      where: eq(strikeResources.id, resourceIdNum),
      with: {
        strike: true
      }
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, resource.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can update resources' },
        { status: 403 }
      );
    }

    // Update resource
    const [updatedResource] = await db
      .update(strikeResources)
      .set({
        title: title ?? resource.title,
        description: description ?? resource.description,
        resourceType: resourceType ?? resource.resourceType,
        fileUrl: fileUrl ?? resource.fileUrl,
        fileName: fileName ?? resource.fileName,
        fileType: fileType ?? resource.fileType,
        fileSize: fileSize ?? resource.fileSize,
        externalUrl: externalUrl ?? resource.externalUrl,
        category: category ?? resource.category,
        sortOrder: sortOrder ?? resource.sortOrder,
        isPrivate: isPrivate ?? resource.isPrivate,
      })
      .where(eq(strikeResources.id, resourceIdNum))
      .returning();

    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ resourceId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resourceId } = await context.params;
    const resourceIdNum = parseInt(resourceId);

    if (isNaN(resourceIdNum)) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 });
    }

    // Get resource with strike info
    const resource = await db.query.strikeResources.findFirst({
      where: eq(strikeResources.id, resourceIdNum),
      with: {
        strike: true
      }
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, resource.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can delete resources' },
        { status: 403 }
      );
    }

    // Delete resource
    await db.delete(strikeResources).where(eq(strikeResources.id, resourceIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
