import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import bcrypt from 'bcryptjs';

interface BulkMember {
  email: string;
  name: string;
  role?: string;
  status?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { unionId: string } }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unionId = parseInt(params.unionId);
    const { members: importMembers } = await request.json();

    if (!importMembers || !Array.isArray(importMembers)) {
      return NextResponse.json(
        { error: 'Invalid members data' },
        { status: 400 }
      );
    }

    // Check if user is an owner of this union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can bulk import members' },
        { status: 403 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const importMember of importMembers as BulkMember[]) {
      try {
        const { email, name, role = 'member', status = 'pending' } = importMember;

        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        let userId: number;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Create new user with temporary password
          const tempPassword = Math.random().toString(36).slice(-12);
          const passwordHash = await bcrypt.hash(tempPassword, 10);

          const [newUser] = await db
            .insert(users)
            .values({
              email: email.toLowerCase(),
              name,
              passwordHash,
              role: 'member',
            })
            .returning();

          userId = newUser.id;
        }

        // Check if member already exists in this union
        const [existingMember] = await db
          .select()
          .from(members)
          .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
          .limit(1);

        if (existingMember) {
          // Update existing member
          await db
            .update(members)
            .set({
              role: role as 'owner' | 'member',
              status: status as 'pending' | 'approved' | 'rejected',
            })
            .where(eq(members.id, existingMember.id));

          results.updated++;
        } else {
          // Create new member
          await db.insert(members).values({
            unionId,
            userId,
            role: role as 'owner' | 'member',
            status: status as 'pending' | 'approved' | 'rejected',
          });

          results.created++;
        }
      } catch (err: any) {
        console.error('Error importing member:', err);
        results.errors.push(`Failed to import ${importMember.email}: ${err.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete. Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
