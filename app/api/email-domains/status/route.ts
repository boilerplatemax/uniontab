/**
 * GET /api/email-domains/status?unionId=123
 *
 * Get verification status and details for a union's email domain
 */

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, unionEmailDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getDomainAuthentication, getValidationSummary } from '@/lib/email/sendgrid-domains';
import { getRateLimitUsage } from '@/lib/email/rate-limits';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unionId from query params
    const { searchParams } = new URL(request.url);
    const unionIdParam = searchParams.get('unionId');

    if (!unionIdParam) {
      return NextResponse.json({ error: 'unionId is required' }, { status: 400 });
    }

    const unionId = parseInt(unionIdParam, 10);

    if (isNaN(unionId)) {
      return NextResponse.json({ error: 'Invalid unionId' }, { status: 400 });
    }

    // Check if user is member of this union
    const [member] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, unionId)
        )
      )
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this union' }, { status: 403 });
    }

    // Get email domain
    const emailDomain = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.unionId, unionId))
      .limit(1);

    if (emailDomain.length === 0) {
      return NextResponse.json(
        {
          configured: false,
          message: 'No email domain configured for this union',
        },
        { status: 404 }
      );
    }

    const domain = emailDomain[0];

    // Get SendGrid domain status
    let sendgridStatus = null;
    let validationSummary = null;

    if (domain.sendgridDomainId) {
      try {
        const sendgridDomain = await getDomainAuthentication(
          parseInt(domain.sendgridDomainId, 10)
        );
        sendgridStatus = sendgridDomain;
        validationSummary = getValidationSummary(sendgridDomain);
      } catch (error) {
        console.error('Failed to get SendGrid domain status:', error);
      }
    }

    // Get rate limit usage
    const rateLimits = await getRateLimitUsage(unionId);

    return NextResponse.json({
      configured: true,
      subdomain: domain.subdomain,
      fullDomain: domain.fullDomain,
      verificationStatus: domain.verificationStatus,
      isVerified: domain.verificationStatus === 'verified',
      verifiedAt: domain.verifiedAt,
      lastVerificationAttempt: domain.lastVerificationAttempt,
      verificationError: domain.verificationError,
      isBlocked: domain.isBlocked,
      blockedReason: domain.blockedReason,
      blockedAt: domain.blockedAt,
      dnsRecords: domain.dnsRecords,
      sendgridDomainId: domain.sendgridDomainId,
      sendgridStatus: sendgridStatus
        ? {
            valid: sendgridStatus.valid,
            dkim1Valid: sendgridStatus.dns.dkim1.valid,
            dkim2Valid: sendgridStatus.dns.dkim2.valid,
            mailCnameValid: sendgridStatus.dns.mail_cname.valid,
          }
        : null,
      validationSummary,
      rateLimits,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    });
  } catch (error: any) {
    console.error('Error getting email domain status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get email domain status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
