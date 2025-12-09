# Cloudflare API Token Setup Guide

## ⚠️ Important: Use Account API Tokens (NOT User API Tokens)

### Why Account API Tokens?
- **Account API Tokens** (✅ REQUIRED): Scoped to specific zones with granular permissions
- **User API Tokens** (❌ LEGACY): Global access across all Cloudflare resources, less secure, being deprecated

### Step-by-Step Instructions

#### 1. Create the Correct Token Type

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Choose **"Edit zone DNS"** template OR click **"Create Custom Token"**

#### 2. Configure Token Permissions

If using custom token:
- **Token name**: `UnionTab DNS Management`
- **Permissions**:
  - `Zone` → `DNS` → `Edit`
- **Zone Resources**:
  - Include → Specific zone → Select `uniontab.com`
- **TTL**: Start Date: Now, End Date: No expiration (or set as needed)

#### 3. Create and Copy Token

1. Click **"Continue to summary"**
2. Review permissions
3. Click **"Create Token"**
4. **IMPORTANT**: Copy the token immediately (you won't see it again!)

#### 4. Add to Environment Variables

Add to your `.env` file:
```env
# Cloudflare Account API Token (NOT User API Token!)
CLOUDFLARE_API_TOKEN=your_token_here

# Get Zone ID from Cloudflare dashboard → Your domain → Overview → Zone ID
CLOUDFLARE_ZONE_ID=your_zone_id_here
```

#### 5. Get Your Zone ID

1. Go to: https://dash.cloudflare.com
2. Click on your domain (`uniontab.com`)
3. Scroll down in the Overview tab
4. Copy the **Zone ID** (right column, under "API" section)

### Verify Your Token

Test that your token works:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

If successful, you'll get a JSON response with your DNS records.

### Common Errors

#### "Invalid API Token"
- You're using a User API Token instead of Account API Token
- Token doesn't have Zone.DNS Edit permissions
- Token is not scoped to the correct zone

#### "Authentication error"
- Token has expired
- Token was deleted or regenerated
- Wrong token format (should start with a long alphanumeric string)

### Migration from User API Token

If you were using a User API Token:
1. Create new Account API Token following steps above
2. Replace `CLOUDFLARE_API_TOKEN` in `.env`
3. Restart your application
4. (Optional) Delete the old User API Token for security
