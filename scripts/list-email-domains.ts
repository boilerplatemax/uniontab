#!/usr/bin/env tsx
/**
 * List all unions and their email domain configuration status
 *
 * Usage:
 *   npx tsx scripts/list-email-domains.ts
 */

import { db } from '../lib/db/drizzle';
import { unions, unionEmailDomains } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function listEmailDomains() {
  console.log('\n📧 Union Email Domain Status\n');
  console.log('═'.repeat(80) + '\n');

  // Get all unions with their email domains
  const allUnions = await db
    .select()
    .from(unions)
    .orderBy(unions.id);

  if (allUnions.length === 0) {
    console.log('❌ No unions found in database\n');
    return;
  }

  for (const union of allUnions) {
    const [emailDomain] = await db
      .select()
      .from(unionEmailDomains)
      .where(eq(unionEmailDomains.unionId, union.id))
      .limit(1);

    const unionName = `${union.name}${union.localNumber ? ` Local ${union.localNumber}` : ''}`;

    console.log(`🏢 ${unionName}`);
    console.log(`   Slug: ${union.slug}`);
    console.log(`   ID: ${union.id}`);

    if (!emailDomain) {
      console.log(`   📧 Email: noreply@uniontab.com (default, no custom domain)`);
      console.log(`   Status: ⚪ Not configured`);
    } else {
      const statusIcon =
        emailDomain.verificationStatus === 'verified' ? '✅' :
        emailDomain.verificationStatus === 'pending' ? '⏳' :
        emailDomain.verificationStatus === 'verifying' ? '🔄' :
        '❌';

      console.log(`   📧 Mass email: notify@${emailDomain.fullDomain}`);
      console.log(`   Status: ${statusIcon} ${emailDomain.verificationStatus}`);

      if (emailDomain.verificationStatus === 'verified') {
        console.log(`   ✓ Verified at: ${emailDomain.verifiedAt?.toLocaleString()}`);
      } else if (emailDomain.verificationError) {
        console.log(`   ⚠️  Error: ${emailDomain.verificationError}`);
      }

      if (emailDomain.lastVerificationAttempt) {
        console.log(`   Last check: ${emailDomain.lastVerificationAttempt.toLocaleString()}`);
      }
    }

    console.log('');
  }

  console.log('─'.repeat(80) + '\n');

  // Summary
  const allDomains = await db
    .select()
    .from(unionEmailDomains);

  const verified = allDomains.filter(d => d.verificationStatus === 'verified').length;
  const pending = allDomains.filter(d => d.verificationStatus === 'pending').length;
  const failed = allDomains.filter(d => d.verificationStatus === 'failed').length;
  const notConfigured = allUnions.length - allDomains.length;

  console.log('📊 Summary:');
  console.log(`   Total unions: ${allUnions.length}`);
  console.log(`   ✅ Verified: ${verified}`);
  console.log(`   ⏳ Pending: ${pending}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚪ Not configured: ${notConfigured}`);

  if (failed > 0 || pending > 0) {
    console.log('\n💡 To fix verification issues:');
    console.log('   npx tsx scripts/fix-email-domain-verification.ts <union-slug>\n');
  }

  if (notConfigured > 0) {
    console.log('\n💡 To configure custom email domains:');
    console.log('   1. Ensure union has Pro or Enterprise plan');
    console.log('   2. Call POST /api/email-domains/setup with unionId');
    console.log('   3. Run fix-email-domain-verification.ts\n');
  }
}

listEmailDomains()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
