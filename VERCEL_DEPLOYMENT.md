# Vercel Deployment Checklist

## Required Environment Variables

Make sure ALL of these environment variables are set in your Vercel project settings:

### 1. Database Configuration (CRITICAL)

**POSTGRES_URL** - This MUST be a connection pooling URL, not a direct connection URL

#### For Supabase:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
Note: Use the **pooler** URL from Supabase, not the direct connection URL

#### For Neon:
```
postgresql://[user]:[password]@[project].pooler.neon.tech/[db]?sslmode=require
```

#### How to set in Vercel:
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add `POSTGRES_URL` with your pooled connection string
4. Apply to Production, Preview, and Development environments

### 2. Other Required Variables

- **BASE_URL** - Your production URL (e.g., `https://uniontab.vercel.app`)
- **AUTH_SECRET** - Random secret for session encryption
- **STRIPE_SECRET_KEY** - Your Stripe secret key
- **STRIPE_WEBHOOK_SECRET** - Your Stripe webhook secret
- **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anon key
- **SENDGRID_API_KEY** - Your SendGrid API key
- **SENDGRID_FROM_EMAIL** - Verified sender email
- **SENDGRID_FROM_NAME** - Sender name

## Common Deployment Issues

### 500 Error on /api/check-union

**Cause**: POSTGRES_URL not set or using wrong connection format

**Solution**:
1. Check Vercel logs: `vercel logs [your-deployment-url]`
2. Verify POSTGRES_URL is set in Vercel environment variables
3. Ensure you're using a **pooled connection URL** (see formats above)
4. Redeploy after adding environment variables

### Database Connection Timeout

**Cause**: Not using connection pooler

**Solution**: Use pooled connection URLs as shown above, not direct database URLs

### "POSTGRES_URL environment variable is not set" error

**Cause**: Environment variable not configured in Vercel

**Solution**:
1. Go to Vercel project settings
2. Add environment variables
3. Redeploy (environment variables require redeployment to take effect)

## Deployment Steps

1. Push your code to GitHub
2. Connect repository to Vercel (if not already connected)
3. Add ALL required environment variables in Vercel settings
4. Trigger a new deployment
5. Check Vercel logs for any errors
6. Test the endpoints:
   - `https://your-domain.vercel.app/api/check-union?slug=test`
   - `https://your-domain.vercel.app/your-union-slug`

## Debugging

To view detailed error logs:
```bash
vercel logs --follow
```

Or check logs in Vercel dashboard → Deployments → [Your Deployment] → Runtime Logs
