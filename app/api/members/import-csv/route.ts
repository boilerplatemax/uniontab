import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Verify user is logged in
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { members: csvMembers, unionId } = await request.json();

    if (!csvMembers || !Array.isArray(csvMembers)) {
      return NextResponse.json(
        { error: 'Invalid CSV data' },
        { status: 400 }
      );
    }

    // Verify user is owner of the union
    const [existingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, session.user.id),
          eq(members.unionId, unionId)
        )
      );

    if (!existingMember || existingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can import members' },
        { status: 403 }
      );
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // Process each member from CSV
    for (const csvMember of csvMembers) {
      try {
        const email = csvMember['Email']?.trim().toLowerCase();

        if (!email) {
          skipped++;
          continue;
        }

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!existingUser) {
          // Skip if user doesn't exist - we don't create new users from CSV
          skipped++;
          continue;
        }

        // Check if member already exists in this union
        const [existingUnionMember] = await db
          .select()
          .from(members)
          .where(
            and(
              eq(members.userId, existingUser.id),
              eq(members.unionId, unionId)
            )
          );

        // Prepare member data
        const memberData: any = {
          phone: csvMember['Phone'] || null,
          employer: csvMember['Employer'] || null,
          jobTitle: csvMember['Job Title'] || null,
          worksite: csvMember['Worksite'] || null,
          employmentStatus: csvMember['Employment Status'] || null,
          memberId: csvMember['Member ID'] || null,
          membershipStatus: csvMember['Membership Status'] || 'active',
          localChapter: csvMember['Local Chapter'] || null,
          bargainingUnit: csvMember['Bargaining Unit'] || null,
          address: csvMember['Address'] || null,
          notes: csvMember['Notes'] || null,
        };

        // Parse dates if present
        if (csvMember['Date of Birth']) {
          try {
            memberData.dateOfBirth = new Date(csvMember['Date of Birth']);
          } catch (e) {
            // Skip invalid dates
          }
        }

        if (csvMember['Start Date With Employer']) {
          try {
            memberData.startDateWithEmployer = new Date(csvMember['Start Date With Employer']);
          } catch (e) {
            // Skip invalid dates
          }
        }

        if (existingUnionMember) {
          // Update existing member
          await db
            .update(members)
            .set(memberData)
            .where(eq(members.id, existingUnionMember.id));

          updated++;
        } else {
          // Create new member
          await db.insert(members).values({
            userId: existingUser.id,
            unionId: unionId,
            role: 'member',
            status: 'approved',
            joinedAt: new Date(),
            ...memberData,
          });

          imported++;
        }
      } catch (error) {
        console.error('Error processing member:', error);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
