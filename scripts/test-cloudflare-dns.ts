/**
 * Test script to verify Cloudflare API token and DNS setup
 *
 * Run with: npx tsx scripts/test-cloudflare-dns.ts
 */

import { getZoneInfo } from '../lib/email/cloudflare-client';

async function testCloudflare() {
  console.log('🔍 Testing Cloudflare API connection...\n');

  // Check environment variables
  const hasToken = !!process.env.CLOUDFLARE_API_TOKEN;
  const hasZoneId = !!process.env.CLOUDFLARE_ZONE_ID;
  const hasBaseDomain = !!process.env.EMAIL_BASE_DOMAIN;

  console.log('Environment Variables:');
  console.log(`  CLOUDFLARE_API_TOKEN: ${hasToken ? '✅ Set' : '❌ Not set'}`);
  console.log(`  CLOUDFLARE_ZONE_ID: ${hasZoneId ? '✅ Set' : '❌ Not set'}`);
  console.log(`  EMAIL_BASE_DOMAIN: ${hasBaseDomain ? '✅ Set' : '❌ Not set'}`);

  if (!hasToken || !hasZoneId) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\nPlease add these to your .env file:');
    console.log('  CLOUDFLARE_API_TOKEN=your-api-token');
    console.log('  CLOUDFLARE_ZONE_ID=your-zone-id');
    console.log('  EMAIL_BASE_DOMAIN=uniontab.com');
    process.exit(1);
  }

  // Test API connection
  try {
    console.log('\n🌐 Fetching zone information...');
    const zoneInfo = await getZoneInfo();

    console.log('\n✅ Successfully connected to Cloudflare!');
    console.log('\nZone Information:');
    console.log(`  Zone ID: ${zoneInfo.id}`);
    console.log(`  Domain: ${zoneInfo.name}`);
    console.log(`  Status: ${zoneInfo.status}`);
    console.log(`  Name Servers: ${zoneInfo.name_servers.join(', ')}`);

    console.log('\n✅ Your Cloudflare API token is working correctly!');
    console.log('🎉 DNS records will be automatically created when new unions are created.');
  } catch (error: any) {
    console.log('\n❌ Failed to connect to Cloudflare API!');
    console.log('\nError:', error.message);
    console.log('\nPossible issues:');
    console.log('  1. Invalid API token');
    console.log('  2. API token lacks "Zone.DNS Edit" permission');
    console.log('  3. Wrong Zone ID');
    console.log('  4. Network connectivity issues');
    process.exit(1);
  }
}

testCloudflare();
