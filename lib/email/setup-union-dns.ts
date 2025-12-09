/**
 * Utility to automatically set up DNS records for a new union
 *
 * This function is called when a new union is created to:
 * 1. Generate a unique subdomain (e.g., "atu123")
 * 2. Create SendGrid domain authentication
 * 3. Create Cloudflare DNS records with friendly comments
 * 4. Save configuration to database
 */

import { db } from '@/lib/db/drizzle';
import { unionEmailDomains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueSubdomain, getFullDomain } from './subdomain';
import {
  createDomainAuthentication,
  extractDnsRecords,
  listDomainAuthentications,
  type SendGridDomainAuth
} from './sendgrid-domains';
import { createSendGridDnsRecords } from './cloudflare-client';

export interface SetupDnsResult {
  success: boolean;
  subdomain?: string;
  fullDomain?: string;
  error?: string;
  dnsRecordsCreated?: number;
}

/**
 * Set up DNS records for a newly created union
 * This will create the subdomain and all necessary DNS records in Cloudflare
 */
export async function setupDnsForNewUnion(
  unionId: number,
  unionName: string,
  localNumber: string | null
): Promise<SetupDnsResult> {
  try {
    console.log(`[DNS Setup] Starting for union ${unionId} (${unionName})`);

    // Check if DNS already exists for this union
    const existingDomain = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.unionId, unionId))
      .limit(1);

    if (existingDomain.length > 0) {
      console.log(`[DNS Setup] DNS already exists for union ${unionId}`);
      return {
        success: false,
        error: 'DNS records already exist for this union',
      };
    }

    // Step 1: Generate unique subdomain
    const subdomain = await generateUniqueSubdomain(unionId, unionName, localNumber);
    const fullDomain = getFullDomain(subdomain);

    console.log(`[DNS Setup] Generated subdomain: ${fullDomain}`);

    // Step 2: Check if SendGrid domain authentication already exists
    let sendgridAuth: SendGridDomainAuth;
    const baseDomain = process.env.EMAIL_BASE_DOMAIN || 'uniontab.com';

    try {
      const existingDomains = await listDomainAuthentications();
      const matchingDomain = existingDomains.find(
        (d) => d.subdomain === subdomain && d.domain === baseDomain
      );

      if (matchingDomain) {
        console.log(`[DNS Setup] Found existing SendGrid domain: ${matchingDomain.id}`);
        sendgridAuth = matchingDomain;
      } else {
        console.log(`[DNS Setup] Creating new SendGrid domain authentication`);
        sendgridAuth = await createDomainAuthentication(baseDomain, subdomain);
        console.log(`[DNS Setup] Created SendGrid domain authentication: ${sendgridAuth.id}`);
      }
    } catch (error: any) {
      console.error(`[DNS Setup] SendGrid error:`, error);
      throw error;
    }

    // Extract DNS records from SendGrid response
    const dnsRecords = extractDnsRecords(sendgridAuth);

    // Step 3: Create Cloudflare DNS records with friendly comments
    const cloudflareRecords = await createSendGridDnsRecords(subdomain, {
      dkim1: {
        host: sendgridAuth.dns.dkim1.host,
        data: sendgridAuth.dns.dkim1.data,
      },
      dkim2: {
        host: sendgridAuth.dns.dkim2.host,
        data: sendgridAuth.dns.dkim2.data,
      },
      mailCname: {
        host: sendgridAuth.dns.mail_cname.host,
        data: sendgridAuth.dns.mail_cname.data,
      },
    });

    console.log(`[DNS Setup] Created ${cloudflareRecords.length} DNS records in Cloudflare`);

    // Prepare record IDs for database
    const cloudflareRecordIds = cloudflareRecords.map((record) => record.id);

    // Step 4: Save to database
    await db.insert(unionEmailDomains).values({
      unionId,
      subdomain,
      fullDomain,
      sendgridDomainId: sendgridAuth.id.toString(),
      verificationStatus: 'pending',
      dnsRecords: dnsRecords,
      cloudflareRecordIds,
      emailsSentToday: 0,
      emailsSentThisHour: 0,
      emailsSentThisMinute: 0,
      dailyResetAt: new Date(),
      hourlyResetAt: new Date(),
      minuteResetAt: new Date(),
      isBlocked: false,
    });

    console.log(`[DNS Setup] Saved configuration to database for union ${unionId}`);
    console.log(`[DNS Setup] ✅ Complete! Union ${unionName} can now send from ${fullDomain}`);

    return {
      success: true,
      subdomain,
      fullDomain,
      dnsRecordsCreated: cloudflareRecords.length,
    };
  } catch (error: any) {
    console.error(`[DNS Setup] ❌ Failed for union ${unionId}:`, error);

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}
