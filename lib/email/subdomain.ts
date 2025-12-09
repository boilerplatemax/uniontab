/**
 * Subdomain Generation Utility
 *
 * Generates unique, sanitized subdomains for multi-tenant email sending.
 * Each tenant gets a subdomain like: atu123.uniontab.com
 */

import { db } from '../db';
import { unions, unionEmailDomains } from '../db/schema';
import { eq } from 'drizzle-orm';

// Base domain for all subdomains
const BASE_DOMAIN = process.env.EMAIL_BASE_DOMAIN || 'uniontab.com';

/**
 * Sanitize a string to be DNS-safe (lowercase alphanumeric + hyphens)
 */
export function sanitizeForDns(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric except hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-{2,}/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 63); // DNS label max length
}

/**
 * Generate a subdomain from union name and local number
 * Examples:
 *   - ATU Local 123 -> atu123
 *   - Teachers Union -> teachers-union
 *   - CUPE 456 -> cupe456
 */
export function generateSubdomain(unionName: string, localNumber?: string | null): string {
  let subdomain = '';

  // Try to extract acronym or shortened name
  const words = unionName.trim().split(/\s+/);

  // If name has multiple words, try to create acronym
  if (words.length > 1) {
    // Check if first word is already an acronym (all caps, 2-6 letters)
    const firstWord = words[0];
    if (/^[A-Z]{2,6}$/.test(firstWord)) {
      subdomain = firstWord.toLowerCase();
    } else {
      // Create acronym from first letters
      subdomain = words.map(w => w[0]).join('').toLowerCase();
    }
  } else {
    // Single word, use it directly
    subdomain = words[0].toLowerCase();
  }

  // Append local number if available
  if (localNumber) {
    const cleanNumber = localNumber.replace(/[^0-9]/g, '');
    if (cleanNumber) {
      subdomain += cleanNumber;
    }
  }

  // Sanitize for DNS
  subdomain = sanitizeForDns(subdomain);

  // Ensure minimum length
  if (subdomain.length < 3) {
    subdomain = subdomain.padEnd(3, '0');
  }

  return subdomain;
}

/**
 * Generate a unique subdomain by checking database and appending suffix if needed
 */
export async function generateUniqueSubdomain(
  unionId: number,
  unionName: string,
  localNumber?: string | null
): Promise<string> {
  let subdomain = generateSubdomain(unionName, localNumber);
  let attempt = 0;
  let isUnique = false;

  // Check if subdomain already exists, append number if it does
  while (!isUnique && attempt < 100) {
    const testSubdomain = attempt === 0 ? subdomain : `${subdomain}${attempt}`;

    // Check if subdomain is already taken by another union
    const existing = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.subdomain, testSubdomain))
      .limit(1);

    if (existing.length === 0) {
      subdomain = testSubdomain;
      isUnique = true;
    } else {
      // Check if it's taken by the same union (re-setup scenario)
      if (existing[0].unionId === unionId) {
        subdomain = testSubdomain;
        isUnique = true;
      } else {
        attempt++;
      }
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique subdomain after 100 attempts');
  }

  return subdomain;
}

/**
 * Get full domain from subdomain
 */
export function getFullDomain(subdomain: string): string {
  return `${subdomain}.${BASE_DOMAIN}`;
}

/**
 * Generate email address for a tenant subdomain
 */
export function getEmailAddress(subdomain: string, localPart: string = 'notify'): string {
  return `${localPart}@${getFullDomain(subdomain)}`;
}

/**
 * Validate subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  // DNS label rules:
  // - 1-63 characters
  // - Only lowercase letters, numbers, and hyphens
  // - Cannot start or end with hyphen
  const dnsLabelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return dnsLabelRegex.test(subdomain);
}

/**
 * Get base domain for configuration
 */
export function getBaseDomain(): string {
  return BASE_DOMAIN;
}
