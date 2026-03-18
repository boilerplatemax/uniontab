import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';

const setPhotoSchema = z.object({
  memberId: z.number().int().positive(),
  unionId: z.number().int().positive(),
  profilePhotoUrl: z.string().url(),
});

const removePhotoSchema = z.object({
  memberId: z.number().int().positive(),
  unionId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = setPhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { memberId, unionId, profilePhotoUrl } = parsed.data;

    // Validate URL is from our Supabase storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !profilePhotoUrl.startsWith(supabaseUrl)) {
      return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
    }

    // Check demo mode
    const [union] = await db
      .select({ isDemo: unions.isDemo })
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Mutations are disabled in demo mode' }, { status: 403 });
    }

    // Check requesting user's membership
    const [requestingMember] = await db
      .select({ id: members.id, role: members.role, status: members.status })
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!requestingMember || requestingMember.status !== 'approved') {
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 });
    }

    // Check authorization: own profile OR admin/owner
    const [targetMember] = await db
      .select({ id: members.id, userId: members.userId, profilePhotoUrl: members.profilePhotoUrl })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.unionId, unionId)))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const isOwnProfile = targetMember.userId === user.id;
    const isAdminOrOwner = requestingMember.role === 'owner' || requestingMember.role === 'admin';

    if (!isOwnProfile && !isAdminOrOwner) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    // Delete old photo from storage if it exists
    if (targetMember.profilePhotoUrl) {
      try {
        const supabase = createClient();
        const oldPath = targetMember.profilePhotoUrl.split('/union-files/')[1];
        if (oldPath) {
          await supabase.storage.from('union-files').remove([oldPath]);
        }
      } catch {
        // Best-effort cleanup, don't fail the request
      }
    }

    // Update the member's profile photo URL
    await db
      .update(members)
      .set({ profilePhotoUrl })
      .where(and(eq(members.id, memberId), eq(members.unionId, unionId)));

    return NextResponse.json({ success: true, profilePhotoUrl });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = removePhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { memberId, unionId } = parsed.data;

    // Check demo mode
    const [union] = await db
      .select({ isDemo: unions.isDemo })
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Mutations are disabled in demo mode' }, { status: 403 });
    }

    // Check requesting user's membership
    const [requestingMember] = await db
      .select({ id: members.id, role: members.role, status: members.status })
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!requestingMember || requestingMember.status !== 'approved') {
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 });
    }

    // Check authorization
    const [targetMember] = await db
      .select({ id: members.id, userId: members.userId, profilePhotoUrl: members.profilePhotoUrl })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.unionId, unionId)))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const isOwnProfile = targetMember.userId === user.id;
    const isAdminOrOwner = requestingMember.role === 'owner' || requestingMember.role === 'admin';

    if (!isOwnProfile && !isAdminOrOwner) {
      return NextResponse.json({ error: 'Not authorized to update this profile' }, { status: 403 });
    }

    // Delete photo from storage
    if (targetMember.profilePhotoUrl) {
      try {
        const supabase = createClient();
        const oldPath = targetMember.profilePhotoUrl.split('/union-files/')[1];
        if (oldPath) {
          await supabase.storage.from('union-files').remove([oldPath]);
        }
      } catch {
        // Best-effort cleanup
      }
    }

    // Set profile photo to null
    await db
      .update(members)
      .set({ profilePhotoUrl: null })
      .where(and(eq(members.id, memberId), eq(members.unionId, unionId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing profile photo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
