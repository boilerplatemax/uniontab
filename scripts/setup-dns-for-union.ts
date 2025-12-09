/**
 * Manual DNS setup script for existing unions
 *
 * Usage: npx tsx scripts/setup-dns-for-union.ts <unionId>
 * Example: npx tsx scripts/setup-dns-for-union.ts 10
 */

import dotenv from 'dotenv';
dotenv.config();

import { db } from '../lib/db/drizzle';
import { unions } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { setupDnsForNewUnion } from '../lib/email/setup-union-dns';

async function setupDns() {
  const unionId = parseInt(process.argv[2]);

  if (!unionId || isNaN(unionId)) {
    console.error('❌ Please provide a valid union ID');
    console.error('Usage: npx tsx scripts/setup-dns-for-union.ts <unionId>');
    console.error('Example: npx tsx scripts/setup-dns-for-union.ts 10');
    process.exit(1);
  }

  console.log(`🔧 Setting up DNS for union ${unionId}...\n`);

  // Get union details
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.id, unionId))
    .limit(1);

  if (!union) {
    console.error(`❌ Union ${unionId} not found in database`);
    process.exit(1);
  }

  console.log(`Union found:`);
  console.log(`  ID: ${union.id}`);
  console.log(`  Name: ${union.name}`);
  console.log(`  Slug: ${union.slug}`);
  console.log(`  Local Number: ${union.localNumber || 'N/A'}`);
  console.log();

  // Run DNS setup
  const result = await setupDnsForNewUnion(
    union.id,
    union.name,
    union.localNumber
  );

  if (result.success) {
    console.log('\n✅ DNS setup completed successfully!');
    console.log(`  Subdomain: ${result.subdomain}`);
    console.log(`  Full Domain: ${result.fullDomain}`);
    console.log(`  DNS Records Created: ${result.dnsRecordsCreated}`);
    console.log('\nYou can now check:');
    console.log(`  - Cloudflare dashboard for DNS records`);
    console.log(`  - https://www.uniontab.com/api/email-domains/status?unionId=${unionId}`);
  } else {
    console.log('\n❌ DNS setup failed!');
    console.log(`  Error: ${result.error}`);
  }
}

setupDns().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
