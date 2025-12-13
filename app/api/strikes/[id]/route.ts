import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, picketZones, picketShifts, picketAssignments, strikeAnnouncements, strikeIncidents, strikeResources } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    // Get the strike with all related data
    const strike = await db.query.strikes.findFirst({
      where: eq(strikes.id, strikeId),
      with: {
        zones: {
          with: {
            shifts: {
              with: {
                assignments: {
                  with: {
                    member: {
                      with: {
                        user: {
                          columns: { id: true, name: true, email: true }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: [picketShifts.date, picketShifts.startTime],
            }
          }
        },
        announcements: {
          orderBy: [desc(strikeAnnouncements.createdAt)],
          with: {
            createdBy: {
              columns: { id: true, name: true }
            }
          }
        },
        incidents: {
          orderBy: [desc(strikeIncidents.createdAt)],
          with: {
            member: {
              with: {
                user: {
                  columns: { id: true, name: true }
                }
              }
            },
            zone: true,
          }
        },
        resources: {
          orderBy: [strikeResources.sortOrder],
        },
        createdBy: {
          columns: { id: true, name: true, email: true }
        },
      },
    });

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member to view this strike' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      strike,
      membership: {
        id: membership.id,
        role: membership.role,
        isAdmin: membership.role === 'admin' || membership.role === 'owner'
      }
    });
  } catch (error) {
    console.error('Error fetching strike:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    const { title, description, rules, startDate, endDate, status } = await request.json();

    // Get the strike
    const [existingStrike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!existingStrike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check if user is an admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, existingStrike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can update strikes' },
        { status: 403 }
      );
    }

    // Update the strike
    const [updatedStrike] = await db
      .update(strikes)
      .set({
        title: title ?? existingStrike.title,
        description: description ?? existingStrike.description,
        rules: rules ?? existingStrike.rules,
        startDate: startDate ? new Date(startDate) : existingStrike.startDate,
        endDate: endDate ? new Date(endDate) : existingStrike.endDate,
        status: status ?? existingStrike.status,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(strikes.id, strikeId))
      .returning();

    return NextResponse.json({ success: true, strike: updatedStrike });
  } catch (error) {
    console.error('Error updating strike:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    // Get the strike
    const [existingStrike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!existingStrike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, existingStrike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can delete strikes' },
        { status: 403 }
      );
    }

    // Delete the strike (cascade will handle related records)
    await db.delete(strikes).where(eq(strikes.id, strikeId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting strike:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
