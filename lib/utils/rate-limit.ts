/**
 * Rate limiting utilities for protecting API endpoints.
 *
 * Uses in-memory storage which works well for single-instance deployments.
 * For multi-instance/serverless, consider using Redis or database-backed storage.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Prefix for the rate limit key (e.g., 'contact-form', 'auth') */
  prefix: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs?: number;
}

/**
 * Check and update rate limit for a given identifier (usually IP address).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();

  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or entry has expired, create new one
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterMs: entry.resetTime - now,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Extract IP address from request headers.
 * Handles common proxy headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback - in production this should rarely happen
  return 'unknown';
}

// Pre-configured rate limiters for common use cases

/**
 * Rate limiter for contact forms.
 * Generous limit but prevents spam: 5 submissions per 15 minutes per IP.
 */
export const contactFormRateLimit: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  prefix: 'contact-form',
};

/**
 * Rate limiter for password reset requests.
 * Prevents enumeration attacks: 5 requests per 15 minutes per IP.
 */
export const passwordResetRateLimit: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  prefix: 'password-reset',
};

/**
 * Rate limiter for email verification resend.
 * 3 requests per 10 minutes per IP.
 */
export const emailVerificationRateLimit: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
  prefix: 'email-verification',
};

/**
 * Stricter rate limiter for suspicious activity.
 * Used when someone hits multiple rate limits.
 */
export const strictRateLimit: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  prefix: 'strict',
};

// ── Account-based login rate limiting ─────────────────────────────────────

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_TRACKING_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check whether a login attempt is currently blocked for this email.
 * Returns { locked: true, retryAfterMs } when locked, { locked: false } otherwise.
 */
export function checkLoginLocked(email: string): { locked: boolean; retryAfterMs?: number } {
  cleanupExpiredEntries();
  const key = `login-attempt:${email.toLowerCase()}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  if (!entry || entry.resetTime < now) return { locked: false };
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { locked: true, retryAfterMs: entry.resetTime - now };
  }
  return { locked: false };
}

/**
 * Record a failed login attempt for the given email.
 * After LOGIN_MAX_ATTEMPTS failures the account is locked for LOGIN_LOCKOUT_MS.
 */
export function recordFailedLogin(email: string): void {
  const key = `login-attempt:${email.toLowerCase()}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Start a fresh tracking window
    rateLimitStore.set(key, { count: 1, resetTime: now + LOGIN_TRACKING_WINDOW_MS });
  } else {
    entry.count++;
    // On the 5th failure set a hard 5-minute lockout from now
    if (entry.count >= LOGIN_MAX_ATTEMPTS) {
      entry.resetTime = now + LOGIN_LOCKOUT_MS;
    }
  }
}

/**
 * Clear the failed-login counter for an email (call after a successful login).
 */
export function clearLoginAttempts(email: string): void {
  const key = `login-attempt:${email.toLowerCase()}`;
  rateLimitStore.delete(key);
}
