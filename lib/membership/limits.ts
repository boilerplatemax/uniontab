import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
}): number {
  // Free tier - no stripe customer ID
  if (!union.stripeCustomerId) {
    return MEMBER_LIMITS.FREE;
  }

  // Check subscription status - must be active or trialing
  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return MEMBER_LIMITS.FREE;
  }

  // Plus plan
  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return MEMBER_LIMITS.PLUS;
  }

  // Base plan (default for paying customers)
  return MEMBER_LIMITS.BASE;
}

/**
 * Get the plan tier name for display purposes
 */
export function getPlanTierName(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
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
