# Magic Staging: Phase 6 - Payment Integration (Stripe)

## Context & Current State
You're continuing development of Magic Staging, an AI-powered virtual staging SaaS app. The core product is FULLY FUNCTIONAL with end-to-end workflow:
- Users can sign up, create projects, upload room images
- AI staging works perfectly (Gemini 2.5 Flash Image) with 8-12 second processing
- Credits system tracks usage (1 credit per AI staging operation)
- Professional UI with before/after gallery, project management
- Local file storage with organized directory structure

## Your Mission: Implement Stripe Payment System
Users currently get 10 free credits but can't purchase more. You need to build the payment system so they can buy credits to continue using the AI staging service.

## Key Files to Reference:
- `/DEVELOPMENT_GUIDE.md` - Updated project roadmap with Phase 6 details
- `/CLAUDE.md` - Project instructions and tech stack
- `/prisma/schema.prisma` - Database schema (Transaction, Organization models)
- `/lib/auth-utils.ts` - Authentication helpers
- `/app/dashboard/projects/[id]/page.tsx` - Working project interface
- `/components/projects/project-detail-client.tsx` - Project UI components

## Phase 6 Scope - Stripe Payment Integration:

### 6.1 Stripe Configuration & Utilities
- [ ] Set up Stripe SDK configuration
- [ ] Create pricing calculation utilities with bulk discounts
- [ ] Build customer management functions
- [ ] Implement webhook signature verification

### 6.2 Payment Intent & Checkout API Routes  
- [ ] Create payment intent generation (`/api/payments/create-intent`)
- [ ] Build Stripe webhook handler (`/api/webhooks/stripe`)
- [ ] Add payment confirmation handling
- [ ] Implement credit allocation logic

### 6.3 Payment Components & UI
- [ ] Build credit purchase interface with preset packages
- [ ] Create Stripe Elements integration
- [ ] Add payment success/failure handling  
- [ ] Implement billing history display

### 6.4 Billing Dashboard
- [ ] Create `/dashboard/billing` page
- [ ] Show current credits, usage history
- [ ] Display transaction history
- [ ] Add credit purchase interface

## Pricing Structure (Credit-Based):
**Base Price**: $4.99 per credit (1 credit = 1 AI staging operation)

**Bulk Discount Packages:**
- **10 credits**: $4.49/credit ($44.90 total)
- **25 credits**: $4.29/credit ($107.25 total) 
- **50 credits**: $3.99/credit ($199.50 total) - **POPULAR**
- **100 credits**: $3.49/credit ($349.00 total)

**Business Logic:**
- 1 credit = 1 AI staging operation (regardless of room type/size)
- Users can stage the same room multiple times (different angles, styles)
- Credits are flexible and encourage experimentation
- Room organization is for workflow/project management, not billing

## Technical Requirements:
- Use Next.js 15 App Router patterns
- TypeScript strict mode (no `any` types)
- Database transactions for credit allocation
- Proper error handling and loading states
- Responsive UI matching existing design
- Follow existing code conventions in the project

## Environment Variables Needed:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Success Criteria:
- Users can purchase credit packages via Stripe
- Credits automatically added to their account after payment
- Billing page shows purchase history and current balance
- Webhook handles payment events securely
- UI matches existing design patterns
- Bulk pricing discounts work correctly

## Important Notes:
- This is a Next.js 15 project with strict TypeScript
- Use existing authentication system (Better-Auth)
- Follow patterns established in current codebase
- Database schema already has Transaction model ready
- Test with Stripe test mode first
- Keep "room" concept for organization, but billing is purely credit-based

## Credit System Context:
The existing system already works with credits:
- `organizationId.creditsRemaining` tracks current balance
- AI staging deducts 1 credit per operation
- Users get 10 free credits on signup
- Credits are simple, flexible, and user-friendly

Start by reading the DEVELOPMENT_GUIDE.md and CLAUDE.md to understand the current codebase, then implement the Stripe integration systematically following the Phase 6 plan.