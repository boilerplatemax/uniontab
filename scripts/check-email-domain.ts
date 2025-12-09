#!/usr/bin/env tsx
/**
 * Check email domain configuration and verification status for a union
 *
 * Usage:
 *   pnpm tsx scripts/check-email-domain.ts <union-slug>
 *
 * Example:
 *   pnpm tsx scripts/check-email-domain.ts cupe-local-67
 */

import { db } from '../lib/db/drizzle';
import { unions, unionEmailDomains } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkEmailDomain(unionSlug: string) {
  console.log(`\n🔍 Checking email domain configuration for: ${unionSlug}\n`);

  // Get union
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, unionSlug))
    .limit(1);

  if (!union) {
    console.error(`❌ Union not found: ${unionSlug}`);
    process.exit(1);
  }

  console.log(`✅ Union found: ${union.name}${union.localNumber ? ` Local ${union.localNumber}` : ''}`);
  console.log(`   Union ID: ${union.id}`);
  console.log(`   Plan: ${union.planName || 'Free'}`);
  console.log(`   Monthly emails sent: ${union.monthlyEmailsSent || 0}`);

  // Check for custom email domain
  const [emailDomain] = await db
    .select()
    .from(unionEmailDomains)
    .where(eq(unionEmailDomains.unionId, union.id))
    .limit(1);

  console.log('\n📧 Email Configuration:');
  console.log('═══════════════════════\n');

  if (!emailDomain) {
    console.log('❌ No custom email domain configured');
    console.log('\n📝 What this means:');
    console.log('   • Regular emails: noreply@uniontab.com ✓ (default)');
    console.log('   • Mass emails: noreply@uniontab.com (no custom subdomain)');
    console.log('\n💡 To set up a custom subdomain:');
    console.log('   1. Run the SQL migration: migrations/add-union-email-domains-table.sql');
    console.log('   2. Set up via API: POST /api/email-domains/setup');
    console.log('   3. Verify DNS: POST /api/email-domains/verify');
    return;
  }

  console.log('✅ Custom email domain IS configured\n');
  console.log(`📍 Subdomain Details:`);
  console.log(`   Subdomain: ${emailDomain.subdomain}`);
  console.log(`   Full domain: ${emailDomain.fullDomain}`);
  console.log(`   SendGrid domain ID: ${emailDomain.sendgridDomainId}`);

  console.log(`\n🔐 Verification Status:`);

  const statusIcon =
    emailDomain.verificationStatus === 'verified' ? '✅' :
    emailDomain.verificationStatus === 'pending' ? '⏳' :
    emailDomain.verificationStatus === 'verifying' ? '🔄' :
    '❌';

  console.log(`   ${statusIcon} Status: ${emailDomain.verificationStatus}`);

  if (emailDomain.verifiedAt) {
    console.log(`   ✓ Verified at: ${emailDomain.verifiedAt.toISOString()}`);
  }

  if (emailDomain.lastVerificationAttempt) {
    console.log(`   Last attempt: ${emailDomain.lastVerificationAttempt.toISOString()}`);
  }

  if (emailDomain.verificationError) {
    console.log(`   ⚠️  Error: ${emailDomain.verificationError}`);
  }

  console.log(`\n📊 Rate Limiting:`);
  console.log(`   Emails today: ${emailDomain.emailsSentToday}`);
  console.log(`   Emails this hour: ${emailDomain.emailsSentThisHour}`);
  console.log(`   Emails this minute: ${emailDomain.emailsSentThisMinute}`);

  if (emailDomain.lastEmailSentAt) {
    console.log(`   Last sent: ${emailDomain.lastEmailSentAt.toISOString()}`);
  }

  if (emailDomain.isBlocked) {
    console.log(`\n🚫 Domain Status: BLOCKED`);
    console.log(`   Reason: ${emailDomain.blockedReason}`);
    console.log(`   Blocked at: ${emailDomain.blockedAt?.toISOString()}`);
  }

  console.log('\n📝 What this means:');
  console.log('═══════════════════════\n');

  if (emailDomain.verificationStatus === 'verified') {
    console.log('✅ Regular emails: noreply@uniontab.com (default behavior)');
    console.log(`✅ Mass emails: notify@${emailDomain.fullDomain} (custom subdomain)`);
    console.log('\n💡 Your custom subdomain is ready for mass emails!');
  } else {
    console.log('✅ Regular emails: noreply@uniontab.com (default behavior)');
    console.log('⏳ Mass emails: noreply@uniontab.com (waiting for DNS verification)');
    console.log('\n💡 Next steps:');
    console.log('   1. Wait 5-10 minutes for DNS propagation');
    console.log('   2. Trigger verification: POST /api/email-domains/verify');
    console.log('   3. Once verified, mass emails will use your custom subdomain');
  }

  console.log('\n');
}

// Get union slug from command line
const unionSlug = process.argv[2];

if (!unionSlug) {
  console.error('Usage: pnpm tsx scripts/check-email-domain.ts <union-slug>');
  console.error('Example: pnpm tsx scripts/check-email-domain.ts cupe-local-67');
  process.exit(1);
}

checkEmailDomain(unionSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
