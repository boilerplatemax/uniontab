/**
 * List all SendGrid authenticated domains
 *
 * Run with: npx tsx scripts/list-sendgrid-domains.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { listDomainAuthentications } from '../lib/email/sendgrid-domains';

async function listDomains() {
  console.log('📋 Listing all SendGrid authenticated domains...\n');

  try {
    const domains = await listDomainAuthentications();

    if (domains.length === 0) {
      console.log('No authenticated domains found.');
      return;
    }

    console.log(`Found ${domains.length} authenticated domain(s):\n`);

    domains.forEach((domain, index) => {
      console.log(`${index + 1}. Domain ID: ${domain.id}`);
      console.log(`   Base Domain: ${domain.domain}`);
      console.log(`   Subdomain: ${domain.subdomain || '(none - base domain)'}`);
      console.log(`   Full Domain: ${domain.subdomain ? `${domain.subdomain}.${domain.domain}` : domain.domain}`);
      console.log(`   Valid: ${domain.valid ? '✅' : '❌'}`);
      console.log(`   DNS Records:`);
      console.log(`     - DKIM1: ${domain.dns.dkim1.host} → ${domain.dns.dkim1.data}`);
      console.log(`     - DKIM2: ${domain.dns.dkim2.host} → ${domain.dns.dkim2.data}`);
      console.log(`     - Return-Path: ${domain.dns.mail_cname.host} → ${domain.dns.mail_cname.data}`);
      console.log();
    });
  } catch (error: any) {
    console.error('❌ Failed to list domains:', error.message);
    process.exit(1);
  }
}

listDomains();
