# 📧 Email Sender Address Fix Guide

## Problem

Mass emails are still sending from `noreply@uniontab.com` instead of your custom subdomain (e.g., `notify@atu123.uniontab.com`).

## Root Cause

The custom email subdomain is only used when the database column `verificationStatus` is set to `'verified'`. Currently, your email domain likely has status:
- `'pending'` - Domain created but not verified yet
- `'verifying'` - Verification in progress
- `'failed'` - Verification failed with errors

### Code Reference

In `lib/email/sendgrid.ts:59`, the sender address logic:

```typescript
async function getFromEmail(unionId?: number, fromLocalPart: string = 'notify') {
  if (!unionId) {
    return { email: FROM_EMAIL, name: FROM_NAME }; // noreply@uniontab.com
  }

  const emailDomain = await db
    .select()
    .from(unionEmailDomains)
    .where(eq(unionEmailDomains.unionId, unionId))
    .limit(1);

  // Only use custom subdomain if verified!
  if (emailDomain.length > 0 && emailDomain[0].verificationStatus === 'verified') {
    return {
      email: getEmailAddress(emailDomain[0].subdomain, fromLocalPart),
      name: FROM_NAME,
    };
  }

  // Fall back to default
  return { email: FROM_EMAIL, name: FROM_NAME }; // noreply@uniontab.com
}
```

## Solution

### Step 1: Fix Your Cloudflare API Token ⚠️ CRITICAL

**You MUST use an Account API Token (NOT a User API Token)**

#### Why This Matters

- **Account API Tokens**: Scoped permissions, secure, actively maintained
- **User API Tokens**: Legacy, global access, being deprecated ❌

#### How to Create the Correct Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Select **"Edit zone DNS"** template
4. Configure:
   - **Permissions**: `Zone → DNS → Edit`
   - **Zone Resources**: Include → Specific zone → `uniontab.com`
5. Click **"Continue to summary"** → **"Create Token"**
6. **Copy the token immediately!** (You won't see it again)

#### Add to Environment

Update your `.env` file:

```env
# Use Account API Token (NOT User API Token!)
CLOUDFLARE_API_TOKEN=your_account_api_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
```

**Get Zone ID**: Cloudflare Dashboard → Your Domain → Overview → Zone ID (right sidebar)

#### Verify Your Token Works

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

✅ Success = JSON response with DNS records
❌ Error = Check token type and permissions

See `CLOUDFLARE_API_TOKEN_SETUP.md` for detailed instructions.

---

### Step 2: Check Email Domain Status

Run the diagnostic script to see all unions and their email verification status:

```bash
npx tsx scripts/list-email-domains.ts
```

This will show:
- Which unions have custom email domains configured
- Their verification status (verified, pending, failed)
- Which union slug to use for fixing

**Example Output:**
```
🏢 ATU Local 123
   Slug: atu-local-123
   ID: 1
   📧 Mass email: notify@atu123.uniontab.com
   Status: ⏳ pending
   Last check: 12/9/2025, 10:30:00 AM
```

---

### Step 3: Fix Verification for Your Union

Run the fix script with your union slug:

```bash
npx tsx scripts/fix-email-domain-verification.ts <union-slug>
```

**Example:**
```bash
npx tsx scripts/fix-email-domain-verification.ts atu-local-123
```

#### What This Script Does

1. ✅ Checks current verification status
2. ✅ Verifies DNS records in Cloudflare
3. ✅ Triggers SendGrid domain verification
4. ✅ Updates database with verification status
5. ✅ Provides next steps if verification fails

#### Possible Outcomes

##### ✅ Success - Domain Verified

```
🎉 SUCCESS! Domain is now verified!

📧 Mass emails will now be sent from: notify@atu123.uniontab.com
```

Your mass emails will now use the custom subdomain!

##### ⏳ Pending - DNS Propagation

```
⏳ Verification not complete yet

💡 Next steps:
   1. DNS records may still be propagating (can take 5-10 minutes)
   2. Check Cloudflare dashboard to ensure DNS records were created
   3. Run this script again in a few minutes
```

**What to do:**
1. Wait 5-10 minutes for DNS propagation
2. Check Cloudflare dashboard for DNS records
3. Run the script again

##### ❌ Failed - Configuration Issues

```
❌ Error during verification: API authentication error

💡 Possible issues:
   • CLOUDFLARE_API_TOKEN is not set or invalid
   • CLOUDFLARE_API_TOKEN is a User API Token (need Account API Token)
   • DNS records were not created in Cloudflare
```

**What to do:**
1. Verify you're using an **Account API Token** (not User API Token)
2. Check token has `Zone.DNS Edit` permissions
3. Verify `CLOUDFLARE_ZONE_ID` is correct
4. Restart your application to load new environment variables

---

### Step 4: Test Mass Email

After verification succeeds:

1. Log into your union admin panel
2. Go to Mass Email section
3. Send a test email to yourself
4. Check the email headers

**Before Fix:**
```
From: UnionTab <noreply@uniontab.com>
```

**After Fix:**
```
From: ATU LOCAL 123 <notify@atu123.uniontab.com>
```

---

## Verification Checklist

Use this checklist to ensure everything is set up correctly:

### Environment Variables
- [ ] `CLOUDFLARE_API_TOKEN` is set (Account API Token, not User API Token)
- [ ] `CLOUDFLARE_ZONE_ID` is set (from Cloudflare dashboard)
- [ ] `SENDGRID_API_KEY` is set and valid
- [ ] `EMAIL_BASE_DOMAIN` is set to `uniontab.com`

### Cloudflare API Token
- [ ] Token type: **Account API Token** (not User API Token)
- [ ] Permission: `Zone → DNS → Edit`
- [ ] Scope: Specific zone (`uniontab.com`)
- [ ] Token is active and not expired

### DNS Records
- [ ] DKIM1 CNAME record exists in Cloudflare
- [ ] DKIM2 CNAME record exists in Cloudflare
- [ ] DNS records have propagated (wait 5-10 minutes)
- [ ] Can verify with `dig CNAME s1._domainkey.{subdomain}.uniontab.com`

### Database Status
- [ ] Run `npx tsx scripts/list-email-domains.ts` to check status
- [ ] `verificationStatus` is `'verified'` (not `'pending'` or `'failed'`)
- [ ] `verifiedAt` timestamp is recent

### Email Testing
- [ ] Send test mass email from union admin panel
- [ ] Verify "From" address is `notify@{subdomain}.uniontab.com`
- [ ] Email is delivered successfully

---

## Quick Reference Commands

```bash
# 1. Check all union email domain statuses
npx tsx scripts/list-email-domains.ts

# 2. Fix verification for a specific union
npx tsx scripts/fix-email-domain-verification.ts <union-slug>

# 3. Check specific union details
npx tsx scripts/check-email-domain.ts <union-slug>

# 4. Verify DNS propagation manually
dig CNAME s1._domainkey.atu123.uniontab.com
dig CNAME s2._domainkey.atu123.uniontab.com

# 5. Test Cloudflare API token
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### Issue: "Invalid API Token" Error

**Cause**: Using User API Token instead of Account API Token

**Fix**:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create new **Account API Token** (not User API Token)
3. Update `CLOUDFLARE_API_TOKEN` in `.env`
4. Restart application

### Issue: DNS Records Not Found

**Cause**: DNS hasn't propagated yet, or records weren't created

**Fix**:
1. Check Cloudflare dashboard → DNS → Records
2. Look for records like `s1._domainkey.atu123.uniontab.com`
3. If missing, re-run setup: `POST /api/email-domains/setup`
4. If present, wait 5-10 minutes for propagation

### Issue: Verification Stays "Pending"

**Cause**: DNS not propagated, or Cloudflare token issues

**Fix**:
1. Wait 5-10 minutes for DNS propagation
2. Verify DNS with `dig CNAME s1._domainkey.{subdomain}.uniontab.com`
3. Check Cloudflare API token is correct (Account API Token)
4. Re-run: `npx tsx scripts/fix-email-domain-verification.ts <slug>`

### Issue: Still Sending from noreply@uniontab.com

**Cause**: Database `verificationStatus` is not `'verified'`

**Fix**:
1. Run: `npx tsx scripts/list-email-domains.ts`
2. Check status of your union
3. If not "verified", run: `npx tsx scripts/fix-email-domain-verification.ts <slug>`
4. If verification succeeds but still wrong sender, check application logs

---

## Support

If you're still having issues after following this guide:

1. **Check logs**: Application logs may show SendGrid or Cloudflare API errors
2. **Verify token type**: Ensure you're using Account API Token (NOT User API Token)
3. **DNS propagation**: Some DNS changes can take up to 24 hours (usually 5-10 minutes)
4. **SendGrid domain**: Verify domain exists in SendGrid dashboard
5. **Rate limits**: Check if you've hit SendGrid or Cloudflare rate limits

## Additional Resources

- `CLOUDFLARE_API_TOKEN_SETUP.md` - Detailed Cloudflare token setup
- `MULTI_SUBDOMAIN_EMAIL_SETUP.md` - Technical architecture overview
- `scripts/check-email-domain.ts` - Detailed union diagnostics
- Cloudflare API Docs: https://developers.cloudflare.com/api/
- SendGrid Domain Auth: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication
