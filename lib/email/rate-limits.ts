/**
 * Enhanced Rate Limiting System
 *
 * Multi-level rate limiting to prevent email abuse:
 * - Per-minute limits (prevent rapid-fire attacks)
 * - Per-hour limits (prevent sustained abuse)
 * - Per-day limits (prevent daily quota exhaustion)
 * - Per-month limits (existing subscription-based limits)
 *
 * Each tenant subdomain has its own rate limit counters.
 */

import { db } from '@/lib/db/drizzle';
import { unionEmailDomains, unions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Rate limit tiers (per time period)
 */
export const RATE_LIMITS = {
  // Per-minute limits
  MINUTE: {
    FREE: 5, // 5 emails per minute
    BASE: 10, // 10 emails per minute
    PREMIUM: 20, // 20 emails per minute
  },
  // Per-hour limits
  HOUR: {
    FREE: 50, // 50 emails per hour
    BASE: 200, // 200 emails per hour
    PREMIUM: 500, // 500 emails per hour
  },
  // Per-day limits
  DAY: {
    FREE: 100, // 100 emails per day
    BASE: 1000, // 1000 emails per day
    PREMIUM: 5000, // 5000 emails per day
  },
  // Per-month limits (from existing system)
  MONTH: {
    FREE: 500,
    BASE: 5000,
    PREMIUM: 15000,
  },
} as const;

/**
 * Plan tier type
 */
export type PlanTier = 'FREE' | 'BASE' | 'PREMIUM';

/**
 * Get plan tier from subscription status
 */
export function getPlanTier(planName?: string | null): PlanTier {
  if (!planName) return 'FREE';

  const plan = planName.toLowerCase();
  if (plan.includes('premium') || plan.includes('plus')) {
    return 'PREMIUM';
  } else if (plan.includes('base') || plan.includes('standard')) {
    return 'BASE';
  }

  return 'FREE';
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  limits: {
    minute: { current: number; limit: number; resetAt: Date };
    hour: { current: number; limit: number; resetAt: Date };
    day: { current: number; limit: number; resetAt: Date };
    month: { current: number; limit: number; resetAt: Date };
  };
  blocked?: boolean; // Is subdomain manually blocked?
}

/**
 * Check if rate limits allow sending
 * Returns detailed information about current usage and limits
 */
export async function checkRateLimit(unionId: number): Promise<RateLimitResult> {
  // Get union and email domain info
  const union = await db.select().from(unions).where(eq(unions.id, unionId)).limit(1);

  if (union.length === 0) {
    throw new Error(`Union ${unionId} not found`);
  }

  const unionData = union[0];
  const planTier = getPlanTier(unionData.planName);

  // Get email domain (if exists)
  const emailDomain = await db
    .select()
    .from(unionEmailDomains)
    .where(eq(unionEmailDomains.unionId, unionId))
    .limit(1);

  const now = new Date();

  // If no email domain configured, only check monthly limits (legacy)
  if (emailDomain.length === 0) {
    const monthlyUsed = unionData.monthlyEmailsSent || 0;
    const monthlyLimit = RATE_LIMITS.MONTH[planTier];
    const resetDate = unionData.emailUsageResetDate || new Date();

    return {
      allowed: monthlyUsed < monthlyLimit,
      reason: monthlyUsed >= monthlyLimit ? 'Monthly limit exceeded' : undefined,
      limits: {
        minute: { current: 0, limit: RATE_LIMITS.MINUTE[planTier], resetAt: now },
        hour: { current: 0, limit: RATE_LIMITS.HOUR[planTier], resetAt: now },
        day: { current: 0, limit: RATE_LIMITS.DAY[planTier], resetAt: now },
        month: { current: monthlyUsed, limit: monthlyLimit, resetAt: resetDate },
      },
    };
  }

  const domain = emailDomain[0];

  // Check if manually blocked
  if (domain.isBlocked) {
    return {
      allowed: false,
      reason: `Email sending blocked: ${domain.blockedReason || 'Abuse detected'}`,
      blocked: true,
      limits: {
        minute: { current: 0, limit: 0, resetAt: now },
        hour: { current: 0, limit: 0, resetAt: now },
        day: { current: 0, limit: 0, resetAt: now },
        month: { current: 0, limit: 0, resetAt: now },
      },
    };
  }

  // Reset counters if needed
  const needsMinuteReset = now > new Date(domain.minuteResetAt);
  const needsHourReset = now > new Date(domain.hourlyResetAt);
  const needsDayReset = now > new Date(domain.dailyResetAt);
  const needsMonthReset = now > new Date(unionData.emailUsageResetDate || 0);

  let minuteCount = needsMinuteReset ? 0 : domain.emailsSentThisMinute;
  let hourCount = needsHourReset ? 0 : domain.emailsSentThisHour;
  let dayCount = needsDayReset ? 0 : domain.emailsSentToday;
  let monthCount = needsMonthReset ? 0 : unionData.monthlyEmailsSent;

  // Get limits for this plan tier
  const minuteLimit = RATE_LIMITS.MINUTE[planTier];
  const hourLimit = RATE_LIMITS.HOUR[planTier];
  const dayLimit = RATE_LIMITS.DAY[planTier];
  const monthLimit = RATE_LIMITS.MONTH[planTier];

  // Calculate reset times
  const minuteResetAt = new Date(now.getTime() + 60 * 1000); // Next minute
  const hourResetAt = new Date(now.getTime() + 60 * 60 * 1000); // Next hour
  const dayResetAt = new Date(now);
  dayResetAt.setHours(24, 0, 0, 0); // Midnight tonight
  const monthResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month

  // Check all limits
  const result: RateLimitResult = {
    allowed: true,
    limits: {
      minute: { current: minuteCount, limit: minuteLimit, resetAt: minuteResetAt },
      hour: { current: hourCount, limit: hourLimit, resetAt: hourResetAt },
      day: { current: dayCount, limit: dayLimit, resetAt: dayResetAt },
      month: { current: monthCount, limit: monthLimit, resetAt: monthResetAt },
    },
  };

  // Check minute limit
  if (minuteCount >= minuteLimit) {
    result.allowed = false;
    result.reason = `Minute limit exceeded (${minuteCount}/${minuteLimit}). Reset at ${minuteResetAt.toISOString()}`;
    return result;
  }

  // Check hour limit
  if (hourCount >= hourLimit) {
    result.allowed = false;
    result.reason = `Hour limit exceeded (${hourCount}/${hourLimit}). Reset at ${hourResetAt.toISOString()}`;
    return result;
  }

  // Check day limit
  if (dayCount >= dayLimit) {
    result.allowed = false;
    result.reason = `Daily limit exceeded (${dayCount}/${dayLimit}). Reset at ${dayResetAt.toISOString()}`;
    return result;
  }

  // Check month limit
  if (monthCount >= monthLimit) {
    result.allowed = false;
    result.reason = `Monthly limit exceeded (${monthCount}/${monthLimit}). Reset at ${monthResetAt.toISOString()}`;
    return result;
  }

  return result;
}

/**
 * Increment rate limit counters after successful email send
 */
export async function incrementRateLimitCounters(unionId: number): Promise<void> {
  // Get email domain
  const emailDomain = await db
    .select()
    .from(unionEmailDomains)
    .where(eq(unionEmailDomains.unionId, unionId))
    .limit(1);

  const now = new Date();

  // If no email domain, only increment monthly counter (legacy)
  if (emailDomain.length === 0) {
    const union = await db.select().from(unions).where(eq(unions.id, unionId)).limit(1);

    if (union.length > 0) {
      const needsReset = now > new Date(union[0].emailUsageResetDate || 0);
      await db
        .update(unions)
        .set({
          monthlyEmailsSent: needsReset ? 1 : (union[0].monthlyEmailsSent || 0) + 1,
          emailUsageResetDate: needsReset
            ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
            : union[0].emailUsageResetDate,
        })
        .where(eq(unions.id, unionId));
    }
    return;
  }

  const domain = emailDomain[0];

  // Check if counters need reset
  const needsMinuteReset = now > new Date(domain.minuteResetAt);
  const needsHourReset = now > new Date(domain.hourlyResetAt);
  const needsDayReset = now > new Date(domain.dailyResetAt);

  // Calculate new counter values
  const minuteCount = needsMinuteReset ? 1 : domain.emailsSentThisMinute + 1;
  const hourCount = needsHourReset ? 1 : domain.emailsSentThisHour + 1;
  const dayCount = needsDayReset ? 1 : domain.emailsSentToday + 1;

  // Calculate next reset times
  const minuteResetAt = needsMinuteReset
    ? new Date(now.getTime() + 60 * 1000)
    : domain.minuteResetAt;
  const hourResetAt = needsHourReset
    ? new Date(now.getTime() + 60 * 60 * 1000)
    : domain.hourlyResetAt;
  const dayResetAt = needsDayReset ? (() => {
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    return tomorrow;
  })() : domain.dailyResetAt;

  // Update email domain counters
  await db
    .update(unionEmailDomains)
    .set({
      emailsSentThisMinute: minuteCount,
      emailsSentThisHour: hourCount,
      emailsSentToday: dayCount,
      lastEmailSentAt: now,
      minuteResetAt,
      hourlyResetAt: hourResetAt,
      dailyResetAt: dayResetAt,
      updatedAt: now,
    })
    .where(eq(unionEmailDomains.unionId, unionId));

  // Also increment monthly counter on unions table
  const union = await db.select().from(unions).where(eq(unions.id, unionId)).limit(1);

  if (union.length > 0) {
    const needsMonthReset = now > new Date(union[0].emailUsageResetDate || 0);
    await db
      .update(unions)
      .set({
        monthlyEmailsSent: needsMonthReset ? 1 : (union[0].monthlyEmailsSent || 0) + 1,
        emailUsageResetDate: needsMonthReset
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : union[0].emailUsageResetDate,
      })
      .where(eq(unions.id, unionId));
  }
}

/**
 * Block a subdomain from sending (manual abuse protection)
 */
export async function blockSubdomain(
  unionId: number,
  reason: string
): Promise<void> {
  await db
    .update(unionEmailDomains)
    .set({
      isBlocked: true,
      blockedReason: reason,
      blockedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(unionEmailDomains.unionId, unionId));
}

/**
 * Unblock a subdomain
 */
export async function unblockSubdomain(unionId: number): Promise<void> {
  await db
    .update(unionEmailDomains)
    .set({
      isBlocked: false,
      blockedReason: null,
      blockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(unionEmailDomains.unionId, unionId));
}

/**
 * Get current rate limit usage summary
 */
export async function getRateLimitUsage(unionId: number) {
  const result = await checkRateLimit(unionId);

  return {
    allowed: result.allowed,
    blocked: result.blocked,
    reason: result.reason,
    usage: {
      minute: {
        used: result.limits.minute.current,
        limit: result.limits.minute.limit,
        remaining: Math.max(0, result.limits.minute.limit - result.limits.minute.current),
        percentUsed: Math.round(
          (result.limits.minute.current / result.limits.minute.limit) * 100
        ),
        resetAt: result.limits.minute.resetAt,
      },
      hour: {
        used: result.limits.hour.current,
        limit: result.limits.hour.limit,
        remaining: Math.max(0, result.limits.hour.limit - result.limits.hour.current),
        percentUsed: Math.round((result.limits.hour.current / result.limits.hour.limit) * 100),
        resetAt: result.limits.hour.resetAt,
      },
      day: {
        used: result.limits.day.current,
        limit: result.limits.day.limit,
        remaining: Math.max(0, result.limits.day.limit - result.limits.day.current),
        percentUsed: Math.round((result.limits.day.current / result.limits.day.limit) * 100),
        resetAt: result.limits.day.resetAt,
      },
      month: {
        used: result.limits.month.current,
        limit: result.limits.month.limit,
        remaining: Math.max(0, result.limits.month.limit - result.limits.month.current),
        percentUsed: Math.round((result.limits.month.current / result.limits.month.limit) * 100),
        resetAt: result.limits.month.resetAt,
      },
    },
  };
}
