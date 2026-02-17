import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Email limit tiers based on subscription status
 */
export const EMAIL_LIMITS = {
  FREE: 500,        // No stripe_customer_id
  BASE: 5000,       // Base plan
  PREMIUM: 15000,   // Premium/Plus plan
} as const;

/**
 * Get the email limit for a union based on their subscription tier
 */
export function getEmailLimit(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  extraMonthlyEmails?: number | null;
}): number {
  const extra = union.extraMonthlyEmails || 0;

  // Free tier - no stripe customer ID
  if (!union.stripeCustomerId) {
    return EMAIL_LIMITS.FREE + extra;
  }

  // Check subscription status - must be active or trialing
  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return EMAIL_LIMITS.FREE + extra;
  }

  // Premium/Plus plan
  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return EMAIL_LIMITS.PREMIUM + extra;
  }

  // Base plan (default for paying customers)
  return EMAIL_LIMITS.BASE + extra;
}

/**
 * Check if a union needs their email usage counter reset (new month)
 */
export function needsEmailUsageReset(resetDate: Date | null): boolean {
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
 * Reset email usage counter for a union
 */
export async function resetEmailUsage(unionId: number): Promise<void> {
  await db
    .update(unions)
    .set({
      monthlyEmailsSent: 0,
      emailUsageResetDate: getNextResetDate(),
    })
    .where(eq(unions.id, unionId));
}

/**
 * Check if a union can send emails (within their limit)
 * Returns { canSend: boolean, limit: number, used: number, remaining: number }
 */
export async function checkEmailLimit(unionId: number, emailsToSend: number = 1): Promise<{
  canSend: boolean;
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

  // Check if we need to reset the counter
  if (needsEmailUsageReset(union.emailUsageResetDate)) {
    await resetEmailUsage(unionId);
    // Refetch union data after reset
    const [updatedUnion] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!updatedUnion) {
      throw new Error('Union not found after reset');
    }

    const limit = getEmailLimit(updatedUnion);
    return {
      canSend: emailsToSend <= limit,
      limit,
      used: 0,
      remaining: limit,
      resetDate: updatedUnion.emailUsageResetDate || getNextResetDate(),
    };
  }

  // Get limit based on subscription tier
  const limit = getEmailLimit(union);
  const used = union.monthlyEmailsSent || 0;
  const remaining = Math.max(0, limit - used);

  return {
    canSend: (used + emailsToSend) <= limit,
    limit,
    used,
    remaining,
    resetDate: union.emailUsageResetDate || getNextResetDate(),
  };
}

/**
 * Increment email usage counter for a union
 */
export async function incrementEmailUsage(unionId: number, count: number): Promise<void> {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  // Check if we need to reset first
  if (needsEmailUsageReset(union.emailUsageResetDate)) {
    await resetEmailUsage(unionId);
    // After reset, increment from 0
    await db
      .update(unions)
      .set({
        monthlyEmailsSent: count,
      })
      .where(eq(unions.id, unionId));
  } else {
    // Increment existing count
    await db
      .update(unions)
      .set({
        monthlyEmailsSent: (union.monthlyEmailsSent || 0) + count,
      })
      .where(eq(unions.id, unionId));
  }
}

/**
 * Get current email usage for a union
 */
export async function getEmailUsage(unionId: number): Promise<{
  limit: number;
  used: number;
  remaining: number;
  resetDate: Date;
  percentUsed: number;
}> {
  const result = await checkEmailLimit(unionId, 0);

  return {
    limit: result.limit,
    used: result.used,
    remaining: result.remaining,
    resetDate: result.resetDate,
    percentUsed: result.limit > 0 ? Math.round((result.used / result.limit) * 100) : 0,
  };
}
