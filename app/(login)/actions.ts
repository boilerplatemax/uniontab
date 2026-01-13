'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  unions,
  members,
  activityLogs,
  type NewUser,
  type NewUnion,
  type NewMember,
  type NewActivityLog,
  ActivityType,
  invitations
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { sendEmailVerification } from '@/lib/email/sendgrid';
import { setupDnsForNewUnion } from '@/lib/email/setup-union-dns';
import crypto from 'crypto';

async function logActivity(
  unionId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (unionId === null || unionId === undefined) {
    return;
  }
  const newActivity: NewActivityLog = {
    unionId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  const userWithUnion = await db
    .select({
      user: users,
      union: unions
    })
    .from(users)
    .leftJoin(members, eq(users.id, members.userId))
    .leftJoin(unions, eq(members.unionId, unions.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithUnion.length === 0) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  const { user: foundUser, union: foundUnion } = userWithUnion[0];

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  // Check if email is verified
  if (!foundUser.emailVerified) {
    return {
      error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
      email,
      password
    };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundUnion?.id, foundUser.id, ActivityType.SIGN_IN)
  ]);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: foundUnion, priceId });
  }

  // Redirect webmaster to admin union management dashboard
  if (foundUser.role === 'webmaster') {
    redirect('/admin/union-management');
  }

  // Redirect to union public page
  if (foundUnion?.slug) {
    redirect(`/${foundUnion.slug}`);
  }

  redirect('/sign-in');
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email(),
  password: z.string().min(8),
  inviteId: z.string().optional(),
  unionName: z.string().min(1, 'Union name is required'),
  localNumber: z.string().optional(),
  publicName: z.string().optional(),
  estimatedMemberCount: z.string().optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { name, email, password, inviteId, unionName, localNumber, publicName, estimatedMemberCount } = data;

  const existingUserWithUnion = await db
    .select({
      user: users,
      union: unions,
    })
    .from(users)
    .leftJoin(members, eq(users.id, members.userId))
    .leftJoin(unions, eq(members.unionId, unions.id))
    .where(eq(users.email, email))
    .limit(1);

  if (existingUserWithUnion.length > 0) {
    const existingUnion = existingUserWithUnion[0].union;
    if (existingUnion) {
      const unionDisplay = existingUnion.localNumber
        ? `${existingUnion.name.toUpperCase()} ${existingUnion.localNumber}`
        : existingUnion.name.toUpperCase();
      return {
        error: `This email is already associated with ${unionDisplay}. Please sign in instead, or use a different email.`,
        email,
        password
      };
    }
    return {
      error: 'This email is already registered. Please sign in instead, or use a different email.',
      email,
      password
    };
  }

  const passwordHash = await hashPassword(password);

  // Generate email verification token (24 hours expiry)
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date();
  verificationExpiry.setHours(verificationExpiry.getHours() + 24);

  const newUser: NewUser = {
    name,
    email,
    passwordHash,
    role: 'owner', // Default role, will be overridden if there's an invitation
    emailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
      password
    };
  }

  let unionId: number;
  let userRole: string;
  let createdUnion: typeof unions.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (invitation) {
      unionId = invitation.unionId;
      userRole = invitation.role;

      await db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invitation.id));

      await logActivity(unionId, createdUser.id, ActivityType.ACCEPT_INVITATION);

      [createdUnion] = await db
        .select()
        .from(unions)
        .where(eq(unions.id, unionId))
        .limit(1);
    } else {
      return { error: 'Invalid or expired invitation.', email, password };
    }
  } else {
    // Create a new union if there's no invitation
    const finalUnionName = unionName;

    // Generate slug from union name and local number
    // Format: {unionname}{localnumber} (e.g., "atu123")
    // If no local number, just use union name (e.g., "atu")
    const unionNameSlug = unionName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const localNumberSlug = localNumber
      ? localNumber.toLowerCase().replace(/[^a-z0-9]+/g, '')
      : '';
    let baseSlug = unionNameSlug + localNumberSlug;

    // Ensure slug meets minimum length requirement (3 characters)
    if (baseSlug.length < 3) {
      return {
        error: 'Union name and local number combination must be at least 3 characters long.',
        email,
        password
      };
    }

    // Reserved slugs that cannot be used
    const reservedSlugs = [
      'sign-in', 'sign-up', 'onboarding', 'api', 'pricing',
      'about', 'contact', 'terms', 'privacy', 'admin', 'settings', 'help',
      'support', 'billing', 'account', 'profile', 'login', 'logout', 'register',
      'signin', 'signup', 'auth', 'oauth', 'callback', 'verify', 'reset'
    ];

    // Check if slug is reserved
    if (reservedSlugs.includes(baseSlug)) {
      return {
        error: `The combination "${unionName}${localNumber ? ' ' + localNumber : ''}" creates a reserved slug. Please choose a different name${localNumber ? ' or local number' : ''}.`,
        email,
        password
      };
    }

    // Check if slug already exists - if so, prevent creation
    const [existingUnion] = await db
      .select()
      .from(unions)
      .where(eq(unions.slug, baseSlug))
      .limit(1);

    if (existingUnion) {
      return {
        error: `A union with the name "${unionName}"${localNumber ? ` and local number "${localNumber}"` : ''} already exists. Please choose a different combination, or email info@uniontab.com if you believe someone has taken your union's name.`,
        email,
        password
      };
    }

    const finalSlug = baseSlug;

    const newUnion: NewUnion = {
      name: finalUnionName,
      slug: finalSlug,
      localNumber: localNumber,
      publicName: publicName || null,
      publishedAt: new Date(), // Publish the union immediately upon creation
      estimatedMemberCount: estimatedMemberCount || null
    };

    [createdUnion] = await db.insert(unions).values(newUnion).returning();

    if (!createdUnion) {
      return {
        error: 'Failed to create union. Please try again.',
        email,
        password
      };
    }

    unionId = createdUnion.id;
    userRole = 'owner';

    await logActivity(unionId, createdUser.id, ActivityType.CREATE_TEAM);

    // Automatically set up DNS records for the new union
    // This runs in the background and doesn't block signup
    setupDnsForNewUnion(unionId, createdUnion.name, createdUnion.localNumber)
      .then((result) => {
        if (result.success) {
          console.log(`✅ DNS setup successful for union ${unionId}: ${result.fullDomain}`);
        } else {
          console.error(`❌ DNS setup failed for union ${unionId}:`, result.error);
        }
      })
      .catch((error) => {
        console.error(`❌ DNS setup error for union ${unionId}:`, error);
      });
  }

  const newMember: NewMember = {
    userId: createdUser.id,
    unionId: unionId,
    role: userRole,
    // Auto-approve owners, pending for regular members
    status: userRole === 'owner' ? 'approved' : 'pending'
  };

  await Promise.all([
    db.insert(members).values(newMember),
    logActivity(unionId, createdUser.id, ActivityType.SIGN_UP),
    setSession(createdUser)
  ]);

  // Send verification email for owners (new signups without invitation)
  if (!inviteId && userRole === 'owner') {
    try {
      await sendEmailVerification(createdUser.email, verificationToken, createdUser.name);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with signup even if email fails
    }
  }

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ team: createdUnion, priceId });
  }

  // Redirect to verification pending page for new owners
  if (!inviteId && userRole === 'owner') {
    redirect('/auth/verify-pending');
  }

  // Redirect to onboarding for new sign-ups
  if (!inviteId) {
    redirect('/onboarding');
  }

  // Redirect invited users to their union's home page
  redirect(`/${createdUnion.slug}`);
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithTeam = await getUserWithTeam(user.id);
  await logActivity(userWithTeam?.unionId, user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(userWithTeam?.unionId, user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Account deletion failed.'
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.unionId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithTeam?.unionId) {
      await db
        .delete(members)
        .where(
          and(
            eq(members.userId, user.id),
            eq(members.unionId, userWithTeam.unionId)
          )
        );
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(userWithTeam?.unionId, user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.number()
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.unionId) {
      return { error: 'User is not part of a union' };
    }

    await db
      .delete(members)
      .where(
        and(
          eq(members.id, memberId),
          eq(members.unionId, userWithTeam.unionId)
        )
      );

    await logActivity(
      userWithTeam.unionId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.unionId) {
      return { error: 'User is not part of a union' };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(members, eq(users.id, members.userId))
      .where(
        and(eq(users.email, email), eq(members.unionId, userWithTeam.unionId))
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: 'User is already a member of this union' };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, email),
          eq(invitations.unionId, userWithTeam.unionId),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Create a new invitation
    await db.insert(invitations).values({
      unionId: userWithTeam.unionId,
      email,
      role,
      invitedBy: user.id,
      status: 'pending'
    });

    await logActivity(
      userWithTeam.unionId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithTeam.union.name, role)

    return { success: 'Invitation sent successfully' };
  }
);
