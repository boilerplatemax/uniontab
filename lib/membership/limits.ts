import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Email invite limits (hidden/secret limits for abuse prevention)
 * These limits are NOT shown to users - they're just backend security measures
 */
export const EMAIL_INVITE_LIMITS = {
  FREE: {
    perBatch: 1,       // Free users can only invite 1 at a time
    perMonth: 300,     // Secret monthly limit
  },
  PAID: {
    perBatch: 500,     // Paid users can invite up to 500 at once
    perMonth: 1000,    // Secret monthly limit
  },
} as const;

/**
 * Member limit tiers based on subscription status
 * Free: 150 approved members
 * Base ($149): 500 approved members
 * Plus ($249): 2000 approved members
 */
export const MEMBER_LIMITS = {
  FREE: 150,       // Free accounts - 150 approved members
  BASE: 500,       // Base plan ($149) - 500 approved members
  PLUS: 2000,      // Plus plan ($249) - 2000 approved members
} as const;

/**
 * Warning thresholds (percentage of limit)
 */
export const MEMBER_WARNING_THRESHOLD = 80; // Show warning at 80% capacity

/**
 * Get the member limit for a union based on their subscription tier
 */
export function getMemberLimit(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  extraMemberLimit?: number | null;
}): number {
  const extra = union.extraMemberLimit || 0;

  // Free tier - no stripe customer ID
  if (!union.stripeCustomerId) {
    return MEMBER_LIMITS.FREE + extra;
  }

  // Check subscription status - must be active or trialing
  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return MEMBER_LIMITS.FREE + extra;
  }

  // Plus plan
  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return MEMBER_LIMITS.PLUS + extra;
  }

  // Base plan (default for paying customers)
  return MEMBER_LIMITS.BASE + extra;
}

/**
 * Get the plan tier name for display purposes
 */
export function getPlanTierName(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  extraMemberLimit?: number | null;
}): string {
  if (!union.stripeCustomerId) {
    return 'Free';
  }

  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return 'Free';
  }

  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return 'Plus';
  }

  return 'Base';
}

/**
 * Get the count of approved members for a union
 */
export async function getApprovedMemberCount(unionId: number): Promise<number> {
  const approvedMembers = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.unionId, unionId),
        eq(members.status, 'approved')
      )
    );

  return approvedMembers.length;
}

/**
 * Check member limit status for a union
 * Returns { canApprove, limit, current, remaining, percentUsed, isNearLimit, tierName }
 */
export async function checkMemberLimit(unionId: number, additionalApprovals: number = 1): Promise<{
  canApprove: boolean;
  limit: number;
  current: number;
  remaining: number;
  percentUsed: number;
  isNearLimit: boolean;
  tierName: string;
}> {
  // Get union data
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  const limit = getMemberLimit(union);
  const tierName = getPlanTierName(union);
  const current = await getApprovedMemberCount(unionId);
  const remaining = Math.max(0, limit - current);
  const percentUsed = limit > 0 ? Math.round((current / limit) * 100) : 0;
  const isNearLimit = percentUsed >= MEMBER_WARNING_THRESHOLD;
  const canApprove = (current + additionalApprovals) <= limit;

  return {
    canApprove,
    limit,
    current,
    remaining,
    percentUsed,
    isNearLimit,
    tierName,
  };
}

/**
 * Get member usage information for display purposes
 */
export async function getMemberUsage(unionId: number): Promise<{
  limit: number;
  current: number;
  remaining: number;
  percentUsed: number;
  isNearLimit: boolean;
  tierName: string;
}> {
  const result = await checkMemberLimit(unionId, 0);
  return {
    limit: result.limit,
    current: result.current,
    remaining: result.remaining,
    percentUsed: result.percentUsed,
    isNearLimit: result.isNearLimit,
    tierName: result.tierName,
  };
}

/**
 * Check if a union has a paid subscription (Base or Plus tier)
 */
export function isPaidSubscription(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}): boolean {
  if (!union.stripeCustomerId) {
    return false;
  }

  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  return isActiveSubscription;
}

/**
 * Get email invite limits for a union based on subscription tier
 */
export function getEmailInviteLimits(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}): { perBatch: number; perMonth: number } {
  if (isPaidSubscription(union)) {
    return EMAIL_INVITE_LIMITS.PAID;
  }
  return EMAIL_INVITE_LIMITS.FREE;
}

/**
 * Check if email invite usage needs to be reset (monthly)
 */
export function needsEmailInviteUsageReset(union: {
  emailInviteUsageResetDate: Date;
}): boolean {
  const now = new Date();
  return now >= union.emailInviteUsageResetDate;
}

/**
 * Reset email invite usage for a union
 */
export async function resetEmailInviteUsage(unionId: number): Promise<void> {
  // Calculate next month's reset date
  const now = new Date();
  const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db
    .update(unions)
    .set({
      monthlyEmailInvitesSent: 0,
      emailInviteUsageResetDate: nextResetDate,
    })
    .where(eq(unions.id, unionId));
}

/**
 * Check if a union can send email invites
 * Returns detailed information about limits and remaining capacity
 */
export async function checkEmailInviteLimit(
  unionId: number,
  emailCount: number
): Promise<{
  canSend: boolean;
  reason?: string;
  current: number;
  limit: number;
  batchLimit: number;
  remaining: number;
  isPaid: boolean;
}> {
  // Get union data
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  // Check if we need to reset monthly counter
  if (needsEmailInviteUsageReset(union)) {
    await resetEmailInviteUsage(unionId);
    // Refetch union data after reset
    const [updatedUnion] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);
    if (updatedUnion) {
      Object.assign(union, updatedUnion);
    }
  }

  const isPaid = isPaidSubscription(union);
  const limits = getEmailInviteLimits(union);
  const current = union.monthlyEmailInvitesSent;
  const remaining = Math.max(0, limits.perMonth - current);

  // Check batch limit first
  if (emailCount > limits.perBatch) {
    return {
      canSend: false,
      reason: isPaid
        ? `You can only send up to ${limits.perBatch} invites at once`
        : 'Free accounts can only send one invite at a time. Upgrade for bulk invites.',
      current,
      limit: limits.perMonth,
      batchLimit: limits.perBatch,
      remaining,
      isPaid,
    };
  }

  // Check monthly limit
  if (current + emailCount > limits.perMonth) {
    return {
      canSend: false,
      reason: 'Monthly invite limit reached. Please try again next month.',
      current,
      limit: limits.perMonth,
      batchLimit: limits.perBatch,
      remaining,
      isPaid,
    };
  }

  return {
    canSend: true,
    current,
    limit: limits.perMonth,
    batchLimit: limits.perBatch,
    remaining,
    isPaid,
  };
}

/**
 * Increment email invite usage counter
 */
export async function incrementEmailInviteUsage(
  unionId: number,
  count: number
): Promise<void> {
  const [union] = await db
    .select({ monthlyEmailInvitesSent: unions.monthlyEmailInvitesSent })
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  await db
    .update(unions)
    .set({
      monthlyEmailInvitesSent: union.monthlyEmailInvitesSent + count,
    })
    .where(eq(unions.id, unionId));
}
