# Stripe Setup Guide for Magic Staging

This guide will walk you through setting up Stripe payments for your Magic Staging application, from development to production.

## 🎯 Quick Overview

**What you'll accomplish:**
- Set up Stripe for development testing (Test Mode)
- Configure webhooks for automatic credit allocation
- Get your app ready for production payments
- Understand the Test Mode → Live Mode transition

**Time needed:** ~15-20 minutes

---

## 📋 Prerequisites

- ✅ You have a Stripe account
- ✅ Magic Staging app is running locally (`npm run dev`)
- ✅ You can access your local app at `http://localhost:3000`

---

## 🚀 Step 1: Access Your Stripe Dashboard

1. **Log into Stripe** at https://dashboard.stripe.com
2. **Important**: Look at the toggle in the top-left corner of the dashboard
   - If it says "Test mode" → You're in the right place! ✅
   - If it says "Live mode" → Click it to switch to "Test mode"

**Why Test Mode?** 
- Test mode lets you simulate payments without real money
- Perfect for development and testing
- You'll use fake credit card numbers
- No actual charges are made

---

## 🔑 Step 2: Get Your API Keys

### Get Your Publishable Key
1. In your Stripe dashboard (in **Test mode**), click **"Developers"** in the left sidebar
2. Click **"API keys"**
3. Find **"Publishable key"** - it starts with `pk_test_`
4. Click **"Reveal test key"** and copy it

### Get Your Secret Key
1. On the same page, find **"Secret key"** - it starts with `sk_test_`
2. Click **"Reveal test key"** and copy it

### Update Your Environment File
1. Open `/Users/tom/Sites/virtual-stage/.env.local`
2. Replace these lines:
```env
# Replace these placeholder values:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"

# With your actual keys:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC123..." # Your real publishable key
STRIPE_SECRET_KEY="sk_test_51XYZ789..."                 # Your real secret key
```

3. **Restart your development server:**
```bash
# Stop the server (Ctrl+C) then restart:
npm run dev
```

---

## 🪝 Step 3: Set Up Webhooks (Critical!)

Webhooks are how Stripe tells your app "Hey, a payment succeeded!" so you can add credits automatically.

### Install Stripe CLI (One-time setup)
```bash
# On macOS:
brew install stripe/stripe-cli/stripe

# On Windows/Linux, download from:
# https://github.com/stripe/stripe-cli/releases
```

### Test Your Webhook Endpoint
1. **In a new terminal window**, navigate to your project:
```bash
cd /Users/tom/Sites/virtual-stage
```

2. **Login to Stripe CLI:**
```bash
stripe login
```
- This will open your browser
- Click "Allow access" to connect the CLI to your account

3. **Start webhook forwarding:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. **Copy the webhook secret** from the terminal output:
```bash
# You'll see something like:
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

5. **Add the webhook secret to your .env.local:**
```env
STRIPE_WEBHOOK_SECRET="whsec_1234567890abcdef..."  # Your actual webhook secret
```

6. **Restart your dev server** (in the original terminal):
```bash
# Ctrl+C to stop, then:
npm run dev
```

### Keep the Webhook Running
- **Leave the `stripe listen` command running** in its terminal
- This forwards Stripe events to your local app
- You'll see webhook events appear in this terminal as they happen

---

## 🧪 Step 4: Test Your Payment System

### Test the Full Flow
1. **Visit your app:** http://localhost:3000
2. **Sign in/up** and navigate to **Dashboard → Billing**
3. **Select a credit package** (try the 10 credits package)
4. **Use Stripe's test credit card:**
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., `12/25`)
   - **CVC:** Any 3 digits (e.g., `123`)
   - **ZIP:** Any 5 digits (e.g., `12345`)

### What Should Happen
1. ✅ Payment form appears with Stripe branding
2. ✅ You can enter the test card details
3. ✅ Click "Pay $44.90" and payment processes
4. ✅ You see a success message
5. ✅ Credits are added to your account automatically
6. ✅ Transaction appears in your billing history

### Check the Webhook Terminal
In your `stripe listen` terminal, you should see:
```bash
2024-01-XX XX:XX:XX   --> payment_intent.succeeded [evt_1ABC...]
```

### Troubleshooting
- **"Webhook signature verification failed"** → Check your `STRIPE_WEBHOOK_SECRET`
- **Payment doesn't complete** → Check browser console for JavaScript errors
- **Credits not added** → Check your `stripe listen` terminal for webhook events

---

## 🎨 Step 5: Test Different Scenarios

### Test Failed Payments
- **Use card number:** `4000 0000 0000 0002` (always declines)
- **Expected result:** Payment fails gracefully, no credits added

### Test Different Package Sizes
- Try the 50 credits package ($199.50) to test larger amounts
- Verify the discount calculations are correct

---

## 🚀 Step 6: Going to Production

### When You're Ready for Real Payments

1. **Switch to Live Mode in Stripe:**
   - In your Stripe dashboard, toggle from "Test mode" to "Live mode"
   - You'll need to complete Stripe's account verification first

2. **Get Live API Keys:**
   - Follow the same process as Step 2, but in Live mode
   - Keys will start with `pk_live_` and `sk_live_`

3. **Set Up Production Webhooks:**
   - In Stripe dashboard (Live mode) → Developers → Webhooks
   - Click "Add endpoint"
   - **Endpoint URL:** `https://yourdomain.com/api/webhooks/stripe`
   - **Events to send:** `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret

4. **Update Production Environment:**
```env
# Production .env or deployment environment variables:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # From production webhook
```

---

## 🔒 Security Checklist

- ✅ Never commit API keys to Git
- ✅ Use environment variables for all secrets
- ✅ Webhook endpoints verify signatures
- ✅ Test mode for development, Live mode for production
- ✅ Validate all payments server-side

---

## 📞 Common Issues & Solutions

### "Invalid API key provided"
- ✅ Check you're using the right key for the right mode (test vs live)
- ✅ Make sure you copied the key completely
- ✅ Restart your dev server after updating .env.local

### "No such payment_intent"
- ✅ Make sure your webhook secret is correct
- ✅ Check that `stripe listen` is running for development

### Credits Not Added After Payment
- ✅ Check webhook terminal for events
- ✅ Check your browser's Network tab for webhook calls
- ✅ Look at your server logs for any errors

### Card Declined in Test Mode
- ✅ Use official Stripe test cards: https://stripe.com/docs/testing#cards
- ✅ Make sure you're in Test mode

---

## 🎉 You're Done!

Your Stripe payment system is now configured and ready! Your users can:
- Purchase credit packages
- See their transaction history  
- Get automatic credit allocation
- Experience secure, PCI-compliant payments

**Next steps:**
- Test thoroughly in development
- Set up monitoring for webhook failures
- Configure email receipts in Stripe dashboard
- Add business details in Stripe settings

---

## 📚 Helpful Resources

- **Stripe Test Cards:** https://stripe.com/docs/testing#cards
- **Webhook Testing:** https://stripe.com/docs/webhooks/test
- **Going Live Checklist:** https://stripe.com/docs/development/checklist
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli