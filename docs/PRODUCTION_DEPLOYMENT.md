# Production Deployment Checklist

This document outlines the essential steps for launching Magic Staging to production.

## 1. Stripe Production Setup

### Get Production API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle to **"Live mode"** (top right switch)
3. Navigate to **Developers → API keys**
4. Copy the **Publishable key** and **Secret key**

### Setup Production Webhooks
1. In Stripe Dashboard → **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Click on the newly created webhook
7. Copy the **"Signing secret"** (starts with `whsec_`)

### Update Environment Variables
Replace test keys in your production environment:
```env
# Production Stripe Keys
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Test Production Payments
1. Use real credit card for small test transaction
2. Verify webhook events are received
3. Check that credits are properly allocated
4. Test refund process if needed

## 2. Additional Production Tasks

*Add other production deployment tasks below as you work on them:*

---

## Notes
- Always test Stripe webhooks in production with small transactions first
- Keep test mode keys in development environment
- Monitor Stripe dashboard for payment issues after launch
- Set up proper logging for webhook failures