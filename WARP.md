# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Next.js 15 + TypeScript (App Router) SaaS for AI virtual staging of real estate photos.
- Backend via Next.js server components/route handlers with Prisma ORM to PostgreSQL.
- Auth via Better-Auth (email + Google OAuth) using Prisma adapter.
- Image generation via Google Gemini; local filesystem storage (S3-ready pathing).
- Payments via Stripe; organization-scoped credits and access control.

Common commands
- Install dependencies
  - npm install
- Development server
  - npm run dev
- Build and run
  - npm run build
  - npm run start
- Lint
  - Lint entire project: npm run lint
  - Lint a single file/path: npm run lint -- app/page.tsx
- Typecheck
  - npm run typecheck
- Prisma (database)
  - Apply schema to DB: npx prisma db push
  - Generate client/types: npx prisma generate
  - Inspect DB: npx prisma studio
- Supabase (local Postgres)
  - Start services: supabase start
  - Check status: supabase status
  - Stop services: supabase stop
  - If CLI is missing on macOS (Homebrew): /opt/homebrew/bin/brew install supabase/tap/supabase
- Tests
  - No test runner is configured in this repo (no test scripts/config present).

Environment configuration
- Required environment variables (from README and code):
  - DATABASE_URL (PostgreSQL)
  - BETTER_AUTH_SECRET
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - GOOGLE_AI_API_KEY
  - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - NEXT_PUBLIC_BETTER_AUTH_URL (optional for client auth base URL)

High-level architecture
- App Router (app/)
  - Public marketing/home at app/page.tsx; global layout at app/layout.tsx.
  - Auth routes at app/sign-in/page.tsx and app/sign-up/page.tsx.
  - Protected dashboard at app/dashboard with its own layout and server-side auth guard via helpers.
- Authentication (lib/auth.ts, lib/auth-utils.ts, lib/auth-client.ts)
  - Server: better-auth configured with Prisma adapter and Google provider; sessions expire in 7 days.
  - Server retrieval: auth.api.getSession({ headers: await headers() }).
  - Guards: requireAuth() and requireAuthWithOrg() enforce user and organization membership.
  - Client: better-auth/react client created with baseURL from NEXT_PUBLIC_BETTER_AUTH_URL or window origin.
- Database and ORM (prisma/schema.prisma, lib/db.ts)
  - Core entities: User, Organization, OrganizationMember (role: owner/admin/member), Project, RoomImage, StagingJob, StagedImage, Transaction, UsageLog.
  - Better-Auth models: Session, Account, Verification.
  - All domain entities include organizationId for multi-tenant scoping; relations cascade appropriately.
  - lib/db.ts provides a singleton Prisma client for server runtime.
- Payments (lib/stripe.ts, lib/stripe-customer.ts)
  - Stripe client initialized with STRIPE_SECRET_KEY (apiVersion 2024-12-18.acacia).
  - Organizations may be linked to Stripe customers; create/update helpers persist stripeCustomerId into Organization.
- AI staging (lib/gemini-production.ts, lib/gemini-simple.ts)
  - Uses GoogleGenerativeAI with model "gemini-2.5-flash-image-preview".
  - Production flow builds a style-aware prompt, generates an image, and persists output via saveUploadedFile.
  - Simple flow supports local validation and writes staged images under public/uploads.
- Storage and image processing (lib/local-storage.ts, lib/image-processing.ts)
  - Local filesystem storage under public/uploads with subfolders originals/ and staged/ organized by organizationId/projectId.
  - Utility ensures directories exist, generates safe filenames, and exposes url paths under /uploads/.
  - Sharp-based image processing utilities: resize/compress, thumbnails, validation.
- Pricing and credits (lib/pricing.ts)
  - Predefined credit packages and helpers for price calculations; enforce credits before staging in business logic.
- Linting/TypeScript config
  - eslint.config.mjs extends next/core-web-vitals and next/typescript; ignores build outputs.
  - tsconfig.json: strict mode, bundler module resolution, path alias @/*.
- Next.js config (next.config.ts)
  - Currently minimal; extend here for images/domains or headers if needed.

Operational rules distilled from CLAUDE.md
- Use the Next.js App Router patterns exclusively; server components/route handlers where appropriate.
- Maintain strict TypeScript (no any); prefer const assertions for literal types.
- Use Prisma for all DB access; keep organizationId scoping across queries and relations.
- Protect privileged routes with requireAuth/requireAuthWithOrg; dashboard requires authentication.
- Validate file uploads (type/size) and inputs (e.g., Zod schemas in API handlers);
  plan for presigned S3 URLs when moving from local storage to S3.
- Check and deduct organization credits when processing staging jobs; record transactions/usage in DB.

Notes and references
- Read README.md for the Quick Start flow and environment variable details.
- docs/README.md links to deeper documentation (tech stack, local vs production, workflows) if present in your checkout.

