# Multi-Subdomain Email Sending System

## Overview

This system enables each tenant (union) to send emails from their own unique subdomain (e.g., `notify@atu123.uniontab.com`). This provides several benefits:

1. **Spam Protection**: If one tenant sends spam, it only affects their subdomain, not your primary domain
2. **Reputation Isolation**: Each tenant has their own email reputation score
3. **Enhanced Rate Limiting**: Per-minute, per-hour, per-day, and per-month limits per tenant
4. **Professional Appearance**: Emails come from a tenant-specific address
5. **Easy Abuse Management**: Block individual tenants without affecting others

## Architecture

### Components

1. **Database Schema** (`lib/db/schema.ts`)
   - `unionEmailDomains` table stores subdomain configuration per tenant
   - Tracks verification status, DNS records, rate limit counters

2. **Subdomain Generation** (`lib/email/subdomain.ts`)
   - Generates unique, DNS-safe subdomains from union name
   - Example: "ATU Local 123" → "atu123"

3. **Cloudflare DNS Client** (`lib/email/cloudflare-client.ts`)
   - Automatically creates CNAME records via Cloudflare API
   - Manages DKIM1, DKIM2, Return-Path records

4. **SendGrid Domain Auth Client** (`lib/email/sendgrid-domains.ts`)
   - Creates domain authentication profiles in SendGrid
   - Validates DNS records and verifies domains

5. **Enhanced Rate Limiting** (`lib/email/rate-limits.ts`)
   - Multi-tier limits: per-minute, per-hour, per-day, per-month
   - Automatic counter reset
   - Manual blocking/unblocking

6. **Modified Email Pipeline** (`lib/email/sendgrid.ts`)
   - Automatically uses tenant subdomain when verified
   - Falls back to default email if not verified
   - Checks rate limits before sending

7. **API Endpoints**
   - `POST /api/email-domains/setup` - Automated setup
   - `GET /api/email-domains/status` - Check verification status
   - `POST /api/email-domains/verify` - Manual verification trigger

## Setup Guide

### Prerequisites

1. **Cloudflare Account**
   - Your domain must be managed by Cloudflare
   - You need an API token with DNS edit permissions

2. **SendGrid Account**
   - Active SendGrid account with API access
   - Domain authentication capability

### Step 1: Environment Variables

Add these to your `.env` file:

```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ZONE_ID=your-zone-id-here

# Email Base Domain
EMAIL_BASE_DOMAIN=uniontab.com

# Existing SendGrid config (should already be set)
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_FROM_EMAIL=noreply@uniontab.com
SENDGRID_FROM_NAME=UnionTab
```

#### Getting Cloudflare Credentials

1. **API Token**:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template
   - Select your domain zone
   - Create token and copy it

2. **Zone ID**:
   - Go to your domain's overview page in Cloudflare
   - Scroll down to "API" section on the right sidebar
   - Copy the "Zone ID"

### Step 2: Run Database Migration

```bash
# Apply the migration
psql $POSTGRES_URL -f migrations/add-union-email-domains-table.sql

# Or if using Drizzle migrations
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### Step 3: Set Up Email Domain for a Tenant

#### Option A: Via API (Automated)

```bash
curl -X POST http://localhost:3000/api/email-domains/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "unionId": 1
  }'
```

This will:
1. Generate a unique subdomain (e.g., "atu123")
2. Create SendGrid domain authentication
3. Create Cloudflare DNS records automatically
4. Save configuration to database

#### Option B: Manual Setup

If you prefer to set up DNS manually:

1. Generate subdomain:
   ```typescript
   import { generateUniqueSubdomain } from '@/lib/email/subdomain';
   const subdomain = await generateUniqueSubdomain(unionId, unionName, localNumber);
   ```

2. Get DNS records from SendGrid API

3. Create DNS records in Cloudflare

### Step 4: Verify Domain

Wait 5-10 minutes for DNS propagation, then verify:

```bash
curl -X POST http://localhost:3000/api/email-domains/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "unionId": 1
  }'
```

Response will indicate if verification succeeded or failed.

### Step 5: Check Status

```bash
curl -X GET "http://localhost:3000/api/email-domains/status?unionId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This returns:
- Verification status
- DNS record details
- Rate limit usage
- SendGrid validation results

## Usage

### Automatic Email Routing

Once a tenant's subdomain is verified, all emails will automatically be sent from their subdomain:

```typescript
// Before: emails sent from noreply@uniontab.com
// After: emails sent from notify@atu123.uniontab.com

await sendEmail({
  to: 'member@example.com',
  subject: 'Welcome!',
  text: 'Welcome to the union',
  html: '<p>Welcome to the union</p>',
  unionId: 1, // Include unionId to use tenant subdomain
});
```

### Rate Limiting

The system enforces multi-tier rate limits:

| Plan    | Per-Minute | Per-Hour | Per-Day | Per-Month |
|---------|------------|----------|---------|-----------|
| FREE    | 5          | 50       | 100     | 500       |
| BASE    | 10         | 200      | 1,000   | 5,000     |
| PREMIUM | 20         | 500      | 5,000   | 15,000    |

Limits are automatically checked before sending and reset at appropriate intervals.

### Checking Rate Limit Usage

```typescript
import { getRateLimitUsage } from '@/lib/email/rate-limits';

const usage = await getRateLimitUsage(unionId);

console.log(usage.usage.minute); // Current minute usage
console.log(usage.usage.hour);   // Current hour usage
console.log(usage.usage.day);    // Current day usage
console.log(usage.usage.month);  // Current month usage
```

### Blocking Abusive Tenants

If a tenant is sending spam or abusing the system:

```typescript
import { blockSubdomain, unblockSubdomain } from '@/lib/email/rate-limits';

// Block
await blockSubdomain(unionId, 'Sending spam emails');

// Unblock
await unblockSubdomain(unionId);
```

## API Reference

### POST /api/email-domains/setup

Set up email domain for a tenant.

**Request:**
```json
{
  "unionId": 1
}
```

**Response:**
```json
{
  "success": true,
  "subdomain": "atu123",
  "fullDomain": "atu123.uniontab.com",
  "sendgridDomainId": 12345,
  "dnsRecords": [...],
  "message": "Email domain setup complete!",
  "nextSteps": [...]
}
```

### GET /api/email-domains/status

Get verification status and details.

**Query Parameters:**
- `unionId` (required): The union ID

**Response:**
```json
{
  "configured": true,
  "subdomain": "atu123",
  "fullDomain": "atu123.uniontab.com",
  "verificationStatus": "verified",
  "isVerified": true,
  "verifiedAt": "2025-12-09T10:30:00Z",
  "sendgridStatus": {
    "valid": true,
    "dkim1Valid": true,
    "dkim2Valid": true,
    "mailCnameValid": true
  },
  "rateLimits": {...}
}
```

### POST /api/email-domains/verify

Manually trigger domain verification.

**Request:**
```json
{
  "unionId": 1
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "validation": {...},
  "message": "Email domain verified successfully!"
}
```

## Troubleshooting

### Domain Not Verifying

1. **Check DNS Propagation**
   ```bash
   dig CNAME s1._domainkey.atu123.uniontab.com
   dig CNAME s2._domainkey.atu123.uniontab.com
   dig CNAME mail.atu123.uniontab.com
   ```

2. **Wait Longer**
   - DNS can take up to 24 hours to propagate globally
   - Typically 5-10 minutes for Cloudflare

3. **Check Cloudflare Records**
   - Ensure records were created successfully
   - Verify they're not proxied (must be DNS-only)

4. **Check SendGrid Dashboard**
   - Go to Settings → Sender Authentication
   - Find your domain and check validation status

### Rate Limit Errors

If you're hitting rate limits unexpectedly:

1. **Check Current Usage**
   ```typescript
   const usage = await getRateLimitUsage(unionId);
   console.log(usage);
   ```

2. **Verify Plan Tier**
   - Check `unions.planName` in database
   - Ensure Stripe subscription is active

3. **Check for Blocks**
   ```typescript
   const status = await checkRateLimit(unionId);
   if (status.blocked) {
     console.log('Reason:', status.reason);
   }
   ```

### Cloudflare API Errors

Common issues:

1. **Invalid API Token**
   - Regenerate token with correct permissions
   - Ensure "Zone.DNS Edit" permission is granted

2. **Wrong Zone ID**
   - Double-check Zone ID from Cloudflare dashboard
   - Make sure it matches your domain

3. **DNS Record Already Exists**
   - Delete existing records manually in Cloudflare
   - Run setup again

### SendGrid API Errors

Common issues:

1. **API Key Invalid**
   - Regenerate API key in SendGrid
   - Ensure "Mail Send" permission is enabled

2. **Domain Already Authenticated**
   - Check SendGrid dashboard for existing authentication
   - Delete old authentication if needed

3. **Invalid Domain**
   - Ensure base domain is correct in env vars
   - Subdomain must be DNS-safe (lowercase alphanumeric + hyphens)

## Database Schema

### unionEmailDomains Table

```sql
CREATE TABLE union_email_domains (
  id SERIAL PRIMARY KEY,
  union_id INTEGER NOT NULL UNIQUE REFERENCES unions(id),

  -- Subdomain config
  subdomain VARCHAR(100) NOT NULL UNIQUE,
  full_domain VARCHAR(255) NOT NULL UNIQUE,

  -- SendGrid config
  sendgrid_domain_id TEXT UNIQUE,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_verification_attempt TIMESTAMP,
  verification_error TEXT,

  -- DNS records (JSON)
  dns_records JSONB,
  cloudflare_record_ids JSONB,

  -- Rate limiting
  emails_sent_today INTEGER NOT NULL DEFAULT 0,
  emails_sent_this_hour INTEGER NOT NULL DEFAULT 0,
  emails_sent_this_minute INTEGER NOT NULL DEFAULT 0,
  last_email_sent_at TIMESTAMP,
  daily_reset_at TIMESTAMP NOT NULL,
  hourly_reset_at TIMESTAMP NOT NULL,
  minute_reset_at TIMESTAMP NOT NULL,

  -- Abuse protection
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP
);
```

## Security Considerations

1. **API Key Protection**
   - Store Cloudflare and SendGrid API keys in environment variables
   - Never commit them to version control
   - Rotate keys periodically

2. **Rate Limiting**
   - Multi-tier limits prevent abuse
   - Automatic blocking for excessive usage
   - Manual override available for admins

3. **DNS Security**
   - DKIM records prevent email spoofing
   - SPF records validate sender identity
   - Return-Path CNAME for bounce handling

4. **Subdomain Isolation**
   - Each tenant's reputation is isolated
   - Spam from one tenant doesn't affect others
   - Easy to block individual abusers

## Performance

- **DNS Record Creation**: ~2-5 seconds per tenant
- **SendGrid Domain Auth**: ~1-2 seconds
- **Verification Check**: ~1 second
- **Email Send**: Same as before (no performance impact)

## Cost Implications

- **Cloudflare DNS**: Free (included in free plan)
- **SendGrid**: No additional cost per domain
- **Database**: Minimal storage (<1KB per tenant)

## Future Enhancements

Potential improvements:

1. **Automatic Verification Retry**
   - Background job to retry failed verifications
   - Scheduled task every 30 minutes

2. **Bulk Setup**
   - Set up domains for multiple tenants at once
   - Progress tracking and error reporting

3. **Email Analytics**
   - Track delivery rates per subdomain
   - Monitor spam complaints
   - Bounce rate tracking

4. **Custom Subdomains**
   - Allow tenants to choose their own subdomain
   - Validation and availability checking

5. **Automated Cleanup**
   - Remove DNS records when tenant is deleted
   - Delete SendGrid domain authentication

## Support

For issues or questions:

1. Check this documentation first
2. Review error logs in your application
3. Check SendGrid and Cloudflare dashboards
4. Contact your development team

## License

This implementation is part of the UnionTab platform and follows the project's license.
