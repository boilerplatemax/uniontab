/**
 * Check what DNS records exist in Cloudflare
 *
 * Run with: npx tsx scripts/check-cloudflare-records.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { listDnsRecords } from '../lib/email/cloudflare-client';

async function checkRecords() {
  console.log('🔍 Checking DNS records in Cloudflare...\n');

  const recordsToCheck = [
    's1._domainkey.uniontab.com',
    's2._domainkey.uniontab.com',
    's1._domainkey.cupe67.uniontab.com',
    's2._domainkey.cupe67.uniontab.com',
    'cupe67.uniontab.com',
    'em2962.uniontab.com',
  ];

  for (const recordName of recordsToCheck) {
    try {
      const records = await listDnsRecords(recordName);
      if (records.length > 0) {
        console.log(`✅ ${recordName}`);
        console.log(`   Type: ${records[0].type}`);
        console.log(`   Content: ${records[0].content}`);
        console.log(`   TTL: ${records[0].ttl}`);
        console.log(`   Proxied: ${records[0].proxied}`);
        console.log(`   Created: ${records[0].created_on}`);
      } else {
        console.log(`❌ ${recordName} - NOT FOUND`);
      }
      console.log();
    } catch (error: any) {
      console.error(`Error checking ${recordName}:`, error.message);
    }
  }
}

checkRecords();
