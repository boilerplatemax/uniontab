#!/usr/bin/env tsx
/**
 * Fix email domain verification for a union
 *
 * This script will:
 * 1. Check current verification status
 * 2. Verify DNS records are correctly set up in Cloudflare
 * 3. Trigger SendGrid verification
 * 4. Update database status
 *
 * Usage:
 *   npx tsx scripts/fix-email-domain-verification.ts <union-slug>
 *
 * Example:
 *   npx tsx scripts/fix-email-domain-verification.ts cupe-local-67
 */

import { db } from '../lib/db/drizzle';
import { unions, unionEmailDomains } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifySendGridDomain } from '../lib/email/sendgrid-domains';

async function fixEmailDomainVerification(unionSlug: string) {
  console.log(`\n🔧 Fixing email domain verification for: ${unionSlug}\n`);
  console.log('═'.repeat(60) + '\n');

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

  console.log(`✅ Union: ${union.name}${union.localNumber ? ` Local ${union.localNumber}` : ''}`);
  console.log(`   ID: ${union.id}\n`);

  // Get email domain
  const [emailDomain] = await db
    .select()
    .from(unionEmailDomains)
    .where(eq(unionEmailDomains.unionId, union.id))
    .limit(1);

  if (!emailDomain) {
    console.error(`\n❌ No custom email domain configured for this union`);
    console.log(`\n💡 To set up a custom email domain:`);
    console.log(`   1. Make sure your union has a Pro or Enterprise plan`);
    console.log(`   2. Call POST /api/email-domains/setup with unionId=${union.id}`);
    console.log(`   3. Run this script again\n`);
    process.exit(1);
  }

  console.log(`📧 Current Configuration:`);
  console.log(`   Subdomain: ${emailDomain.subdomain}`);
  console.log(`   Full domain: ${emailDomain.fullDomain}`);
  console.log(`   SendGrid Domain ID: ${emailDomain.sendgridDomainId}`);
  console.log(`   Status: ${emailDomain.verificationStatus}`);

  if (emailDomain.verificationError) {
    console.log(`   Last error: ${emailDomain.verificationError}`);
  }

  if (emailDomain.verifiedAt) {
    console.log(`   Verified at: ${emailDomain.verifiedAt.toISOString()}`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // If already verified, just confirm
  if (emailDomain.verificationStatus === 'verified') {
    console.log('✅ Domain is already verified!');
    console.log(`\n📧 Mass emails will be sent from: notify@${emailDomain.fullDomain}\n`);
    return;
  }

  // Try to verify the domain
  console.log('🔄 Attempting to verify domain with SendGrid...\n');

  try {
    const verification = await verifySendGridDomain(emailDomain.sendgridDomainId);

    console.log('📊 Verification Results:\n');
    console.log(`   DKIM1: ${verification.dkim1.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   DKIM2: ${verification.dkim2.valid ? '✅ Valid' : '❌ Invalid'}`);

    const allValid = verification.dkim1.valid && verification.dkim2.valid;

    if (allValid) {
      // Update database
      await db
        .update(unionEmailDomains)
        .set({
          verificationStatus: 'verified',
          verifiedAt: new Date(),
          lastVerificationAttempt: new Date(),
          verificationError: null,
        })
        .where(eq(unionEmailDomains.id, emailDomain.id));

      console.log('\n🎉 SUCCESS! Domain is now verified!\n');
      console.log(`📧 Mass emails will now be sent from: notify@${emailDomain.fullDomain}\n`);
    } else {
      // Update with error
      await db
        .update(unionEmailDomains)
        .set({
          verificationStatus: 'failed',
          lastVerificationAttempt: new Date(),
          verificationError: 'DNS records not yet valid. Wait 5-10 minutes for DNS propagation.',
        })
        .where(eq(unionEmailDomains.id, emailDomain.id));

      console.log('\n⏳ Verification not complete yet\n');
      console.log('💡 Next steps:');
      console.log('   1. DNS records may still be propagating (can take 5-10 minutes)');
      console.log('   2. Check Cloudflare dashboard to ensure DNS records were created');
      console.log('   3. Run this script again in a few minutes');
      console.log('\n📝 To check DNS records manually:');
      console.log(`   dig CNAME s1._domainkey.${emailDomain.fullDomain}`);
      console.log(`   dig CNAME s2._domainkey.${emailDomain.fullDomain}\n`);
    }
  } catch (error: any) {
    console.error('\n❌ Error during verification:', error.message);

    // Update database with error
    await db
      .update(unionEmailDomains)
      .set({
        verificationStatus: 'failed',
        lastVerificationAttempt: new Date(),
        verificationError: error.message,
      })
      .where(eq(unionEmailDomains.id, emailDomain.id));

    console.log('\n💡 Possible issues:');
    console.log('   • CLOUDFLARE_API_TOKEN is not set or invalid');
    console.log('   • CLOUDFLARE_API_TOKEN is a User API Token (need Account API Token)');
    console.log('   • DNS records were not created in Cloudflare');
    console.log('   • SendGrid API key is invalid');
    console.log('   • Network connectivity issues\n');
    console.log('🔧 See CLOUDFLARE_API_TOKEN_SETUP.md for API token setup guide\n');

    process.exit(1);
  }
}

// Get union slug from command line
const unionSlug = process.argv[2];

if (!unionSlug) {
  console.error('\n❌ Usage: npx tsx scripts/fix-email-domain-verification.ts <union-slug>');
  console.error('   Example: npx tsx scripts/fix-email-domain-verification.ts cupe-local-67\n');
  process.exit(1);
}

fixEmailDomainVerification(unionSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
