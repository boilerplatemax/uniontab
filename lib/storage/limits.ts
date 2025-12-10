import { db } from '@/lib/db/drizzle';
import { unions, files, postAttachments, announcementAttachments } from '@/lib/db/schema';
import { eq, sum } from 'drizzle-orm';

/**
 * Storage limit tiers based on subscription status (in bytes)
 */
export const STORAGE_LIMITS = {
  FREE: 1 * 1024 * 1024 * 1024,        // 1 GB
  BASE: 10 * 1024 * 1024 * 1024,       // 10 GB
  PLUS: 30 * 1024 * 1024 * 1024,       // 30 GB
} as const;

/**
 * Get the storage limit for a union based on their subscription tier (in bytes)
 */
export function getStorageLimit(union: {
  stripeCustomerId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
}): number {
  // Free tier - no stripe customer ID
  if (!union.stripeCustomerId) {
    return STORAGE_LIMITS.FREE;
  }

  // Check subscription status - must be active or trialing
  const isActiveSubscription =
    union.subscriptionStatus === 'active' ||
    union.subscriptionStatus === 'trialing';

  if (!isActiveSubscription) {
    return STORAGE_LIMITS.FREE;
  }

  // Plus plan
  if (union.planName?.toLowerCase().includes('plus') ||
      union.planName?.toLowerCase().includes('premium')) {
    return STORAGE_LIMITS.PLUS;
  }

  // Base plan (default for paying customers)
  return STORAGE_LIMITS.BASE;
}

/**
 * Calculate total storage used by a union across all files and attachments
 */
export async function calculateStorageUsed(unionId: number): Promise<number> {
  // Calculate storage from files table
  const filesResult = await db
    .select({ total: sum(files.fileSize) })
    .from(files)
    .where(eq(files.unionId, unionId));

  const filesTotal = Number(filesResult[0]?.total || 0);

  // Calculate storage from post attachments
  const postAttachmentsResult = await db
    .select({ total: sum(postAttachments.fileSize) })
    .from(postAttachments)
    .where(eq(postAttachments.unionId, unionId));

  const postAttachmentsTotal = Number(postAttachmentsResult[0]?.total || 0);

  // Calculate storage from announcement attachments
  const announcementAttachmentsResult = await db
    .select({ total: sum(announcementAttachments.fileSize) })
    .from(announcementAttachments)
    .where(eq(announcementAttachments.unionId, unionId));

  const announcementAttachmentsTotal = Number(announcementAttachmentsResult[0]?.total || 0);

  return filesTotal + postAttachmentsTotal + announcementAttachmentsTotal;
}

/**
 * Update the storage used counter for a union
 */
export async function updateStorageUsage(unionId: number): Promise<void> {
  const totalUsed = await calculateStorageUsed(unionId);

  await db
    .update(unions)
    .set({
      storageUsedBytes: totalUsed,
    })
    .where(eq(unions.id, unionId));
}

/**
 * Check if a union can upload a file (within their storage limit)
 * Returns { canUpload: boolean, limit: number, used: number, remaining: number }
 */
export async function checkStorageLimit(unionId: number, fileSizeBytes: number = 0): Promise<{
  canUpload: boolean;
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
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

  // Get limit based on subscription tier
  const limit = getStorageLimit(union);
  const used = union.storageUsedBytes || 0;
  const remaining = Math.max(0, limit - used);
  const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0;

  return {
    canUpload: (used + fileSizeBytes) <= limit,
    limit,
    used,
    remaining,
    percentUsed,
  };
}

/**
 * Get current storage usage for a union
 */
export async function getStorageUsage(unionId: number): Promise<{
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
  limitFormatted: string;
  usedFormatted: string;
  remainingFormatted: string;
}> {
  const result = await checkStorageLimit(unionId, 0);

  return {
    limit: result.limit,
    used: result.used,
    remaining: result.remaining,
    percentUsed: result.percentUsed,
    limitFormatted: formatBytes(result.limit),
    usedFormatted: formatBytes(result.used),
    remainingFormatted: formatBytes(result.remaining),
  };
}

/**
 * Increment storage usage counter for a union
 */
export async function incrementStorageUsage(unionId: number, bytes: number): Promise<void> {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  await db
    .update(unions)
    .set({
      storageUsedBytes: (union.storageUsedBytes || 0) + bytes,
    })
    .where(eq(unions.id, unionId));
}

/**
 * Decrement storage usage counter for a union
 */
export async function decrementStorageUsage(unionId: number, bytes: number): Promise<void> {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    throw new Error('Union not found');
  }

  const newUsage = Math.max(0, (union.storageUsedBytes || 0) - bytes);

  await db
    .update(unions)
    .set({
      storageUsedBytes: newUsage,
    })
    .where(eq(unions.id, unionId));
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
