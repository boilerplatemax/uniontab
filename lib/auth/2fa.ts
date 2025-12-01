import crypto from 'crypto';

/**
 * Generate a 6-digit verification code
 */
export function generate2FACode(): string {
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

/**
 * Hash a verification code for storage
 */
export function hash2FACode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a 2FA code against a hash
 */
export function verify2FACode(code: string, hash: string): boolean {
  const codeHash = hash2FACode(code);
  return codeHash === hash;
}

/**
 * Generate expiry time for 2FA code (10 minutes from now)
 */
export function get2FACodeExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Check if a 2FA code has expired
 */
export function is2FACodeExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
