# Magic Staging - External Services Setup Guide

This guide provides step-by-step instructions for setting up all external services, API keys, and configurations required for Magic Staging to function fully in production.

## Overview of Required Services

| Service | Purpose | Cost | Required For |
|---------|---------|------|--------------|
| Google Cloud Console | OAuth + Gemini AI | Free tier + usage | Authentication & AI Staging |
| Stripe | Payment processing | 2.9% + 30¢ per transaction | Room purchases |
| AWS S3 | File storage | ~$0.023/GB/month | Image storage |
| Supabase (Production) | PostgreSQL database | Free tier available | Data persistence |
| Resend | Email delivery | Free tier: 3K emails/month | User notifications |
| Vercel | Hosting & deployment | Free tier available | Production deployment |

---

## 1. Google Cloud Console Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. **IMPORTANT**: Enter your final app name: `magicstaging`
   - ⚠️ **Project ID cannot be changed later** - choose carefully!
   - This matches your domain `magicstaging.com`
   - Must be globally unique and 6-30 characters
4. Select your organization (if applicable)
5. Click "Create"

### 1.2 Enable Required APIs
1. Navigate to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google+ API** (for OAuth)
   - **Generative AI API** (for Gemini 2.5 Flash)
3. Click "Enable" for each

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill out required fields:
   - **App name**: `Magic Staging`
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **App domain**: `https://magicstaging.com` (add localhost for dev)
   - **Developer contact**: Your email
4. **Scopes**: Add `email`, `profile`, `openid`
5. **Test users**: Add your email for testing
6. Save and continue

### 1.4 Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: `Magic Staging Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (development)
   - `http://localhost:3003` (development) 
   - `https://magicstaging.com` (production)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3003/api/auth/callback/google`
   - `https://magicstaging.com/api/auth/callback/google`
7. Click "Create"
8. **Save the Client ID and Client Secret** - you'll need these for `.env.local`

### 1.5 Get Gemini AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Select your Google Cloud project
4. Click "Create API Key"
5. **Copy and save the API key** - you'll need this for `.env.local`

**Environment Variables to Add:**
```env
GOOGLE_CLIENT_ID="your-oauth-client-id-here"
GOOGLE_CLIENT_SECRET="your-oauth-client-secret-here"
GOOGLE_AI_API_KEY="your-gemini-api-key-here"
```

---

## 2. Stripe Payment Setup

### 2.1 Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up for a new account
3. Complete business verification (required for live payments)
4. Verify your bank account for payouts

### 2.2 Get API Keys
1. In Stripe Dashboard, go to "Developers" → "API keys"
2. **Test Keys** (for development):
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
3. **Live Keys** (for production - get these after testing):
   - Copy "Publishable key" (starts with `pk_live_`)
   - Copy "Secret key" (starts with `sk_live_`)

### 2.3 Configure Webhooks
1. Go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. **Endpoint URL**: 
   - Development: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
   - Production: `https://magicstaging.com/api/webhooks/stripe`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `customer.updated`
5. Click "Add endpoint"
6. **Copy the webhook signing secret** (starts with `whsec_`)

### 2.4 Set Up Products (Optional - we'll do this via API)
1. Go to "Products" → "Add product"
2. Create these products:
   - **Individual Room**: $4.99
   - **10-Room Package**: $44.90 (10% discount)
   - **50-Room Package**: $199.50 (20% discount)

**Environment Variables to Add:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_key_here"
STRIPE_SECRET_KEY="sk_test_your_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

---

## 3. AWS S3 Setup

### 3.1 Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com)
2. Sign up for AWS account
3. Complete payment method verification

### 3.2 Create IAM User for S3 Access
1. Go to "IAM" → "Users" → "Create user"
2. Username: `magic-staging-s3-user`
3. Attach policies directly: `AmazonS3FullAccess`
4. Create user
5. Go to user → "Security credentials" → "Create access key"
6. Use case: "Application running outside AWS"
7. **Save Access Key ID and Secret Access Key**

### 3.3 Create S3 Bucket
1. Go to "S3" → "Create bucket"
2. **Bucket name**: `magicstaging-storage-prod` (must be globally unique)
3. **Region**: Choose region closest to your users (e.g., `us-east-1`)
4. **Block Public Access**: Keep all blocked (we'll use presigned URLs)
5. **Bucket Versioning**: Enable
6. **Server-side encryption**: Enable with Amazon S3 managed keys
7. Create bucket

### 3.4 Configure CORS
1. Go to your bucket → "Permissions" → "Cross-origin resource sharing (CORS)"
2. Add this configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:3003", "https://magicstaging.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

**Environment Variables to Add:**
```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key_id_here"
AWS_SECRET_ACCESS_KEY="your_secret_access_key_here"
AWS_S3_BUCKET_NAME="magicstaging-storage-prod"
```

---

## 4. Supabase Production Setup

### 4.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Choose your organization
4. **Name**: `Magic Staging`
5. **Database Password**: Generate strong password (save it!)
6. **Region**: Choose closest to your users
7. Click "Create new project"

### 4.2 Get Database URL
1. Go to "Settings" → "Database"
2. Find "Connection string" → "URI"
3. Copy the connection string
4. **Replace `[YOUR-PASSWORD]` with your actual database password**

### 4.3 Configure Database
1. The Prisma schema will automatically create all tables when you run:
```bash
npx prisma db push
```

**Environment Variables to Add:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

---

## 5. Resend Email Setup

### 5.1 Create Resend Account
1. Go to [Resend](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 5.2 Add Domain (Production)
1. Go to "Domains" → "Add Domain"
2. Enter your domain: `magicstaging.com`
3. Add the required DNS records to your domain provider:
   - **MX Record**: Points to Resend's mail servers
   - **TXT Record**: For domain verification
   - **DKIM Records**: For email authentication

### 5.3 Get API Key
1. Go to "API Keys" → "Create API Key"
2. Name: `Magic Staging`
3. Permission: "Sending access"
4. **Copy the API key** (starts with `re_`)

**Environment Variables to Add:**
```env
RESEND_API_KEY="re_your_api_key_here"
```

---

## 6. Vercel Deployment Setup

### 6.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Framework Preset**: Next.js
5. **Root Directory**: `./` (if project is in root)

### 6.2 Configure Environment Variables
1. Go to project settings → "Environment Variables"
2. Add all production environment variables:

```env
# Database
DATABASE_URL="your-supabase-production-url"

# Better Auth
BETTER_AUTH_SECRET="your-secure-32-character-secret-key-here"
BETTER_AUTH_URL="https://magicstaging.com"

# Google OAuth & AI
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
STRIPE_SECRET_KEY="sk_live_your_live_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_S3_BUCKET_NAME="magicstaging-storage-prod"

# Email
RESEND_API_KEY="re_your_resend_api_key"

# App Configuration
NEXT_PUBLIC_APP_URL="https://magicstaging.com"
```

### 6.3 Custom Domain (Optional)
1. Go to project settings → "Domains"
2. Add your custom domain
3. Configure DNS with your domain provider
4. Update environment variables with your custom domain

---

## 7. Security Configuration

### 7.1 Generate Better-Auth Secret
```bash
# Generate a secure 32-character secret
openssl rand -base64 32
```

### 7.2 Update OAuth Redirect URLs
After deployment, update these services with your production URLs:
- **Google OAuth**: Add production domain to authorized origins/redirects
- **Stripe Webhooks**: Update webhook URL to production domain

---

## 8. Environment Variables Checklist

Create/update your `.env.local` file with all required variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"  # Local dev
# DATABASE_URL="your-supabase-production-url"  # Production

# Better Auth
BETTER_AUTH_SECRET="your-secure-32-character-secret-here"
BETTER_AUTH_URL="http://localhost:3000"  # Local dev
# BETTER_AUTH_URL="https://magicstaging.com"  # Production

# Google OAuth
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Google AI (Gemini)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_S3_BUCKET_NAME="magicstaging-storage-dev"  # Dev bucket
# AWS_S3_BUCKET_NAME="magicstaging-storage-prod"  # Production bucket

# Email
RESEND_API_KEY="re_your_resend_api_key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Local dev
# NEXT_PUBLIC_APP_URL="https://magicstaging.com"  # Production
```

---

## 9. Testing Your Setup

### 9.1 Verify Database Connection
```bash
npx prisma studio
# Should open database GUI at http://localhost:5555
```

### 9.2 Test Authentication
1. Visit `http://localhost:3000/sign-up`
2. Create account with email/password
3. Try Google OAuth sign-up
4. Verify user appears in database

### 9.3 Test File Upload (After Phase 4)
1. Create a project
2. Upload test images
3. Verify files appear in S3 bucket
4. Check database records

### 9.4 Test AI Staging (After Phase 5)
1. Upload room image
2. Create staging job
3. Verify AI processing works
4. Check generated images in S3

### 9.5 Test Payments (After Phase 6)
1. Use Stripe test card: `4242 4242 4242 4242`
2. Purchase credits
3. Verify webhook handling
4. Check transaction records

---

## 10. Production Deployment Checklist

### Before Going Live:
- [ ] All API keys configured in Vercel
- [ ] Custom domain configured and SSL enabled
- [ ] Database migrated to production Supabase
- [ ] S3 bucket configured with production settings
- [ ] Stripe switched to live keys
- [ ] OAuth redirect URIs updated for production domain
- [ ] Webhook URLs updated for production
- [ ] Email domain configured in Resend
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Analytics configured (optional: Google Analytics)

### Security Checklist:
- [ ] All environment variables are secure
- [ ] No secrets committed to repository
- [ ] S3 bucket is private with presigned URLs only
- [ ] Webhook endpoints have signature verification
- [ ] Rate limiting enabled on API routes
- [ ] Input validation on all endpoints
- [ ] CORS properly configured

---

## 11. Cost Estimates

### Development Phase (Monthly):
- **Google Cloud**: Free tier (generous limits)
- **Stripe**: Free (test mode)
- **AWS S3**: ~$1-5 for dev storage
- **Supabase**: Free tier (500MB, 2GB bandwidth)
- **Resend**: Free tier (3,000 emails)
- **Vercel**: Free tier
- **Total**: ~$1-10/month

### Production (Per 1000 Stagings):
- **Gemini AI**: ~$39 (1000 × $0.039)
- **AWS S3**: ~$2-5 (storage + bandwidth)
- **Stripe**: ~$149 (3% of $4,990 revenue)
- **Supabase**: $25/month (Pro plan)
- **Other services**: ~$10-20
- **Total Costs**: ~$225 per 1000 stagings
- **Revenue**: $4,990 per 1000 stagings
- **Net Profit**: ~$4,765 per 1000 stagings (95%+ margin)

---

## 12. Common Issues & Troubleshooting

### OAuth Issues:
- Ensure redirect URIs exactly match (including http/https)
- Check OAuth consent screen is properly configured
- Verify client ID/secret are correct

### Database Issues:
- Ensure Supabase project is running
- Check connection string format
- Verify password is correct (no special characters in URL)

### S3 Upload Issues:
- Check IAM user has S3 permissions
- Verify bucket name is correct
- Ensure CORS is configured

### Stripe Issues:
- Use test card numbers in development
- Check webhook endpoint is accessible
- Verify webhook secret matches

### Build Issues:
- All environment variables must be set
- Check for TypeScript errors
- Ensure all dependencies are installed

---

## 13. Next Steps

After completing this setup:

1. **Test all integrations** with the verification steps above
2. **Proceed to Phase 4**: File Upload & Storage System implementation
3. **Complete remaining phases** systematically
4. **Deploy to production** when all features are complete

**Support**: If you encounter issues with any service setup, check their respective documentation or contact their support teams.