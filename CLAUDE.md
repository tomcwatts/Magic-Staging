# VirtueStage Pro - AI Virtual Staging SaaS

## Project Overview
VirtueStage Pro is a Next.js 15 TypeScript SaaS application that uses Google's Gemini 2.5 Flash Image model to perform AI-powered virtual staging for real estate professionals. Room-based pricing at $4.99 per room.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Better-Auth (email + Google OAuth)
- **Payments**: Stripe (pay-per-use model)
- **Storage**: AWS S3 (images)
- **AI**: Google Gemini 2.5 Flash Image API
- **Deployment**: Vercel

## Essential Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript checks
- `npx prisma studio` - Database GUI
- `npx prisma db push` - Push schema changes
- `npx prisma generate` - Generate Prisma client

### Supabase (Local Development)
- `supabase start` - Start local Supabase
- `supabase status` - Check services status
- `supabase stop` - Stop local services
- `supabase db reset` - Reset local database

### Testing
- `npm test` - Run tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report

## Code Style Guidelines
- Use ES modules (import/export) syntax
- Destructure imports when possible: `import { foo } from 'bar'`
- Use TypeScript strict mode - no `any` types
- Prefer const assertions for literal types
- Use Prisma client for all database operations
- Implement proper error boundaries for React components
- Follow Next.js 15 App Router patterns exclusively

## File Structure
├── app/ # Next.js 15 App Router
│ ├── api/ # API routes
│ ├── dashboard/ # Protected dashboard routes
│ └── (auth)/ # Auth group routes
├── components/ # React components
│ ├── ui/ # shadcn/ui components
│ ├── auth/ # Authentication components
│ ├── upload/ # File upload components
│ ├── staging/ # AI staging components
│ └── payments/ # Stripe payment components
├── lib/ # Utility libraries
├── prisma/ # Database schema
└── public/ # Static assets

## Development Workflow
1. **ALWAYS** run `supabase status` to ensure database is running
2. **ALWAYS** run `npm run typecheck` after making changes
3. Test functionality in browser before committing
4. Commit with descriptive messages following conventional commits
5. Use `npx prisma studio` to inspect database changes

## Authentication Flow
- Better-Auth handles sessions automatically
- Use `requireAuth()` and `requireAuthWithOrg()` helpers
- Protected routes under `/dashboard` require authentication
- Organization context required for most features

## Database Patterns
- All tables have `organizationId` for row-level security
- Use Prisma client with proper TypeScript types
- Include relationships in queries when needed
- Use transactions for multi-table operations

## API Route Patterns
- Validate inputs with Zod schemas
- Use proper HTTP status codes
- Include error handling and logging
- Return consistent JSON response formats
- Implement rate limiting for public endpoints

## Payment Integration
- Room-based pricing: $4.99 per staging
- Bulk discounts: 10+ rooms = $4.49, 50+ = $3.99
- Use Stripe Payment Intents for security
- Webhooks handle credit allocation
- Track all transactions in database

## AI Integration
- Gemini 2.5 Flash Image model
- Cost: ~$0.039 per generated image
- Optimize prompts for virtual staging
- Handle processing errors gracefully
- Store AI metadata for analytics

## Security Requirements
- Validate all user inputs
- Use presigned URLs for S3 uploads
- Implement proper CORS policies
- Rate limit API endpoints
- Secure webhook endpoints with signatures

## Important Notes
- NEVER use `any` types - maintain strict TypeScript
- ALWAYS check credits before allowing staging operations
- File uploads must be validated for type and size
- S3 keys should include organization/project structure
- AI processing can take 30-60 seconds - show progress
- Test payment webhooks in development with Stripe CLI

## Error Handling
- Use toast notifications for user feedback
- Log errors to console with context
- Implement graceful fallbacks
- Provide clear error messages to users
- Handle network timeouts appropriately

## Performance
- Optimize images with Next.js Image component
- Cache database queries where appropriate
- Use React Suspense for loading states
- Implement proper loading indicators
- Minimize bundle size with tree shaking
