/**
 * POST /api/email-domains/setup
 *
 * Automatically set up a subdomain for email sending:
 * 1. Generate unique subdomain
 * 2. Create SendGrid domain authentication
 * 3. Create Cloudflare DNS records
 * 4. Save configuration to database
 */

import { NextResponse } from 'next/server';
import { getJwtPayload } from '@/lib/auth';
import { db } from '@/lib/db';
import { unions, members, unionEmailDomains } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateUniqueSubdomain, getFullDomain, getBaseDomain } from '@/lib/email/subdomain';
import {
  createDomainAuthentication,
  extractDnsRecords,
} from '@/lib/email/sendgrid-domains';
import { createSendGridDnsRecords } from '@/lib/email/cloudflare-client';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const payload = await getJwtPayload();
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.id;

    // Get request body
    const body = await request.json();
    const { unionId } = body;

    if (!unionId) {
      return NextResponse.json({ error: 'unionId is required' }, { status: 400 });
    }

    // Check if user is owner/admin of this union
    const member = await db
      .select()
      .from(members)
      .where(eq(members.userId, userId))
      .where(eq(members.unionId, unionId))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json({ error: 'Not a member of this union' }, { status: 403 });
    }

    const userRole = member[0].role;
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can set up email domains' },
        { status: 403 }
      );
    }

    // Get union info
    const union = await db.select().from(unions).where(eq(unions.id, unionId)).limit(1);

    if (union.length === 0) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    const unionData = union[0];

    // Check if email domain already exists
    const existingDomain = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.unionId, unionId))
      .limit(1);

    if (existingDomain.length > 0) {
      return NextResponse.json(
        {
          error: 'Email domain already exists for this union',
          domain: existingDomain[0],
        },
        { status: 409 }
      );
    }

    // Step 1: Generate unique subdomain
    const subdomain = await generateUniqueSubdomain(
      unionId,
      unionData.name,
      unionData.localNumber
    );
    const fullDomain = getFullDomain(subdomain);
    const baseDomain = getBaseDomain();

    console.log(`Generated subdomain for union ${unionId}: ${fullDomain}`);

    // Step 2: Create SendGrid domain authentication
    const sendgridAuth = await createDomainAuthentication(baseDomain, subdomain);

    console.log(`Created SendGrid domain authentication: ${sendgridAuth.id}`);

    // Extract DNS records from SendGrid response
    const dnsRecords = extractDnsRecords(sendgridAuth);

    // Step 3: Create Cloudflare DNS records
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

    console.log(`Created ${cloudflareRecords.length} DNS records in Cloudflare`);

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

    console.log(`Saved email domain configuration to database for union ${unionId}`);

    return NextResponse.json({
      success: true,
      subdomain,
      fullDomain,
      sendgridDomainId: sendgridAuth.id,
      dnsRecords,
      message:
        'Email domain setup complete! DNS records have been created. Verification will be attempted automatically in a few minutes.',
      nextSteps: [
        'DNS records typically propagate within 5-10 minutes',
        'You can check verification status at /api/email-domains/status',
        'Once verified, all emails will be sent from your subdomain',
      ],
    });
  } catch (error: any) {
    console.error('Error setting up email domain:', error);

    return NextResponse.json(
      {
        error: 'Failed to set up email domain',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
