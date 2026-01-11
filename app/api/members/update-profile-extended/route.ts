import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memberId, unionId, section, ...data } = body;

    if (!memberId || !unionId || !section) {
      return NextResponse.json(
        { error: 'Member ID, Union ID, and section are required' },
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
        { error: 'You do not have permission to edit members' },
        { status: 403 }
      );
    }

    // Get the member to update
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent editing owners unless you are also an owner
    if (memberToUpdate.role === 'owner' && userMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can edit other owners' },
        { status: 403 }
      );
    }

    // Build update object based on section
    let updateData: Record<string, any> = {};

    switch (section) {
      case 'personal':
        updateData = {
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          middleName: data.middleName || null,
          preferredName: data.preferredName || null,
          personalEmail: data.personalEmail || null,
          homePhone: data.homePhone || null,
          cellPhone: data.cellPhone || null,
          phone: data.cellPhone || null, // Keep legacy field in sync
          address: data.address || null,
          city: data.city || null,
          province: data.province || null,
          postalCode: data.postalCode || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          emergencyContactName: data.emergencyContactName || null,
          emergencyContactPhone: data.emergencyContactPhone || null,
          emergencyContactRelation: data.emergencyContactRelation || null,
        };
        break;

      case 'employment':
        updateData = {
          employer: data.employer || null,
          jobTitle: data.jobTitle || null,
          worksite: data.worksite || null,
          employmentStatus: data.employmentStatus || null,
          department: data.department || null,
          employeeId: data.employeeId || null,
          shift: data.shift || null,
          supervisor: data.supervisor || null,
          classification: data.classification || null,
          wageRate: data.wageRate || null,
          startDateWithEmployer: data.startDateWithEmployer ? new Date(data.startDateWithEmployer) : null,
          endDateWithEmployer: data.endDateWithEmployer ? new Date(data.endDateWithEmployer) : null,
          seniorityDate: data.seniorityDate ? new Date(data.seniorityDate) : null,
        };
        break;

      case 'union':
        updateData = {
          memberId: data.memberIdNumber || null,
          membershipStatus: data.membershipStatus || null,
          membershipType: data.membershipType || null,
          localChapter: data.localChapter || null,
          bargainingUnit: data.bargainingUnit || null,
          subUnit: data.subUnit || null,
          unionEmail: data.unionEmail || null,
          votingStatus: data.votingStatus || null,
          seniorityNumber: data.seniorityNumber || null,
          steward: data.steward || null,
          joinDate: data.joinDate ? new Date(data.joinDate) : null,
        };
        break;

      case 'settings':
        updateData = {
          allowPhoneCalls: data.allowPhoneCalls ?? true,
          allowTextMessages: data.allowTextMessages ?? true,
          allowEmails: data.allowEmails ?? true,
          allowPushNotifications: data.allowPushNotifications ?? true,
          preferredLanguage: data.preferredLanguage || 'en',
          communicationPreference: data.communicationPreference || 'email',
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid section' },
          { status: 400 }
        );
    }

    // Update member profile
    await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, memberId));

    return NextResponse.json({
      success: true,
      message: 'Member profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { error: 'Failed to update member profile' },
      { status: 500 }
    );
  }
}
