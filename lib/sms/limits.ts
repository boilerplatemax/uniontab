import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * SMS limit tiers based on subscription status
 * Free accounts do not have access to SMS
 */
export const SMS_LIMITS = {
  FREE: 0,         // Free accounts cannot send SMS
  BASE: 10,        // Base plan - 10 SMS/month
  PREMIUM: 25,     // Premium/Plus plan - 25 SMS/month
} as const;

/**
 * SMS character limit (standard SMS limit)
 */
export const SMS_CHARACTER_LIMIT = 160;

/**
 * Get the SMS limit for a union based on their subscription tier
 */
export function getSMSLimit(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}): number {
  // Free tier - no stripe customer ID - no SMS access
  if (!union.stripeCustomerId) {
    return SMS_LIMITS.FREE;
  }

  // Check subscription status - must be active or trialing
  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return SMS_LIMITS.FREE;
  }

  // Premium/Plus plan
  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return SMS_LIMITS.PREMIUM;
  }

  // Base plan (default for paying customers)
  return SMS_LIMITS.BASE;
}

/**
 * Check if union has SMS access (is on a paid plan)
 */
export function hasSMSAccess(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}): boolean {
  return getSMSLimit(union) > 0;
}

/**
 * Check if a union needs their SMS usage counter reset (new month)
 */
export function needsSMSUsageReset(resetDate: Date | null): boolean {
  if (!resetDate) return true;
  return new Date() >= resetDate;
}

/**
 * Get the next reset date (first day of next month)
 */
export function getNextResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * Reset SMS usage counter for a union
 */
export async function resetSMSUsage(unionId: number): Promise<void> {
  await db
    .update(unions)
    .set({
      monthlySMSSent: 0,
      smsUsageResetDate: getNextResetDate(),
    })
    .where(eq(unions.id, unionId));
}

/**
 * Check if a union can send SMS (within their limit)
 * Returns { canSend: boolean, hasAccess: boolean, limit: number, used: number, remaining: number }
 */
export async function checkSMSLimit(unionId: number, smsToSend: number = 1): Promise<{
  canSend: boolean;
  hasAccess: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetDate: Date;
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

  // Check if union has SMS access
  const hasAccess = hasSMSAccess(union);

  if (!hasAccess) {
    return {
      canSend: false,
      hasAccess: false,
      limit: 0,
      used: 0,
      remaining: 0,
      resetDate: getNextResetDate(),
    };
  }

  // Check if we need to reset the counter
  if (needsSMSUsageReset(union.smsUsageResetDate)) {
    await resetSMSUsage(unionId);
    // Refetch union data after reset
    const [updatedUnion] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!updatedUnion) {
      throw new Error('Union not found after reset');
    }

    const limit = getSMSLimit(updatedUnion);
    return {
      canSend: smsToSend <= limit,
      hasAccess: true,
      limit,
      used: 0,
      remaining: limit,
      resetDate: updatedUnion.smsUsageResetDate || getNextResetDate(),
    };
  }

  // Get limit based on subscription tier
  const limit = getSMSLimit(union);
  const used = union.monthlySMSSent || 0;
  const remaining = Math.max(0, limit - used);

  return {
    canSend: (used + smsToSend) <= limit,
    hasAccess: true,
    limit,
    used,
    remaining,
    resetDate: union.smsUsageResetDate || getNextResetDate(),
  };
}

/**
 * Increment SMS usage counter for a union
 */
export async function incrementSMSUsage(unionId: number, count: number): Promise<void> {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  // Check if we need to reset first
  if (needsSMSUsageReset(union.smsUsageResetDate)) {
    await resetSMSUsage(unionId);
    // After reset, increment from 0
    await db
      .update(unions)
      .set({
        monthlySMSSent: count,
      })
      .where(eq(unions.id, unionId));
  } else {
    // Increment existing count
    await db
      .update(unions)
      .set({
        monthlySMSSent: (union.monthlySMSSent || 0) + count,
      })
      .where(eq(unions.id, unionId));
  }
}

/**
 * Get current SMS usage for a union
 */
export async function getSMSUsage(unionId: number): Promise<{
  hasAccess: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetDate: Date;
  percentUsed: number;
}> {
  const result = await checkSMSLimit(unionId, 0);

  return {
    hasAccess: result.hasAccess,
    limit: result.limit,
    used: result.used,
    remaining: result.remaining,
    resetDate: result.resetDate,
    percentUsed: result.limit > 0 ? Math.round((result.used / result.limit) * 100) : 0,
  };
}
