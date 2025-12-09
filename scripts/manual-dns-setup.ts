/**
 * Manual DNS setup script for debugging
 *
 * This script manually creates the DNS records that SendGrid SHOULD have created
 * Run with: npx tsx scripts/manual-dns-setup.ts <subdomain>
 * Example: npx tsx scripts/manual-dns-setup.ts cupe67
 */

import dotenv from 'dotenv';
dotenv.config();

import { createDnsRecords } from '../lib/email/cloudflare-client';
import type { DnsRecord } from '../lib/email/cloudflare-client';

async function manualSetup() {
  const subdomain = process.argv[2];

  if (!subdomain) {
    console.error('❌ Please provide a subdomain');
    console.error('Usage: npx tsx scripts/manual-dns-setup.ts <subdomain>');
    console.error('Example: npx tsx scripts/manual-dns-setup.ts cupe67');
    process.exit(1);
  }

  const baseDomain = process.env.EMAIL_BASE_DOMAIN || 'uniontab.com';
  const fullDomain = `${subdomain}.${baseDomain}`;

  console.log(`🔧 Setting up DNS records for ${fullDomain}...\n`);

  // These are the SendGrid values from domain 28784766
  const sendgridTarget = 's1.domainkey.u57679230.wl231.sendgrid.net';
  const sendgridTarget2 = 's2.domainkey.u57679230.wl231.sendgrid.net';
  const returnPathTarget = 'u57679230.wl231.sendgrid.net';

  const records: DnsRecord[] = [
    {
      type: 'CNAME',
      name: `s1._domainkey.${fullDomain}`,
      content: sendgridTarget,
      ttl: 3600,
      proxied: false,
      comment: `SendGrid DKIM1 for ${subdomain} - Required for email authentication`,
    },
    {
      type: 'CNAME',
      name: `s2._domainkey.${fullDomain}`,
      content: sendgridTarget2,
      ttl: 3600,
      proxied: false,
      comment: `SendGrid DKIM2 for ${subdomain} - Required for email authentication`,
    },
    {
      type: 'CNAME',
      name: fullDomain,
      content: returnPathTarget,
      ttl: 3600,
      proxied: false,
      comment: `SendGrid Return-Path for ${subdomain} - Required for bounce handling`,
    },
  ];

  console.log('Creating DNS records:');
  records.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.type} ${r.name} → ${r.content}`);
  });
  console.log();

  try {
    const createdRecords = await createDnsRecords(records);
    console.log(`\n✅ Successfully created/verified ${createdRecords.length} DNS records!`);
    console.log('\nNext steps:');
    console.log('1. Wait 5-10 minutes for DNS propagation');
    console.log('2. Check Cloudflare dashboard to see the records');
    console.log('3. Verify in SendGrid (Settings → Sender Authentication)');
  } catch (error: any) {
    console.error('\n❌ Failed to create DNS records:', error.message);
    process.exit(1);
  }
}

manualSetup();
