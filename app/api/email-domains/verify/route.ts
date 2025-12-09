/**
 * POST /api/email-domains/verify
 *
 * Manually trigger verification of email domain DNS records
 */

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, unionEmailDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateDomainAuthentication } from '@/lib/email/sendgrid-domains';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { unionId } = body;

    if (!unionId) {
      return NextResponse.json({ error: 'unionId is required' }, { status: 400 });
    }

    // Check if user is owner/admin of this union
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

    const userRole = member.role;
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can verify email domains' },
        { status: 403 }
      );
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
          error: 'No email domain configured for this union',
          hint: 'Use POST /api/email-domains/setup to set up an email domain first',
        },
        { status: 404 }
      );
    }

    const domain = emailDomain[0];

    if (!domain.sendgridDomainId) {
      return NextResponse.json(
        { error: 'SendGrid domain ID not found' },
        { status: 400 }
      );
    }

    // Trigger SendGrid validation
    console.log(`Triggering verification for SendGrid domain ${domain.sendgridDomainId}`);

    const validation = await validateDomainAuthentication(
      parseInt(domain.sendgridDomainId, 10)
    );

    // Update database with verification results
    const now = new Date();
    const isValid = validation.valid;

    const updateData: any = {
      verificationStatus: isValid ? 'verified' : 'failed',
      lastVerificationAttempt: now,
      updatedAt: now,
    };

    if (isValid) {
      updateData.verifiedAt = now;
      updateData.verificationError = null;
    } else {
      // Compile error messages from validation results
      const errors = [];
      if (!validation.validation_results.dkim1.valid) {
        errors.push(`DKIM1: ${validation.validation_results.dkim1.reason || 'Invalid'}`);
      }
      if (!validation.validation_results.dkim2.valid) {
        errors.push(`DKIM2: ${validation.validation_results.dkim2.reason || 'Invalid'}`);
      }
      if (!validation.validation_results.mail_cname.valid) {
        errors.push(
          `Return-Path: ${validation.validation_results.mail_cname.reason || 'Invalid'}`
        );
      }
      updateData.verificationError = errors.join('; ');
    }

    await db
      .update(unionEmailDomains)
      .set(updateData)
      .where(eq(unionEmailDomains.unionId, unionId));

    console.log(
      `Verification ${isValid ? 'succeeded' : 'failed'} for union ${unionId}: ${domain.fullDomain}`
    );

    return NextResponse.json({
      success: true,
      verified: isValid,
      validation,
      message: isValid
        ? 'Email domain verified successfully! You can now send emails from this subdomain.'
        : 'Verification failed. Please check the DNS records and try again.',
      nextSteps: isValid
        ? ['All system emails will now be sent from your verified subdomain']
        : [
            'Check that DNS records are properly configured in Cloudflare',
            'Wait 5-10 minutes for DNS propagation',
            'Try verifying again',
          ],
    });
  } catch (error: any) {
    console.error('Error verifying email domain:', error);

    return NextResponse.json(
      {
        error: 'Failed to verify email domain',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
