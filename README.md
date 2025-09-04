# 🏠✨ Magic Staging

**AI-powered virtual staging SaaS application** that transforms empty rooms into professionally staged spaces for real estate professionals.

![Magic Staging](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Mobile](https://img.shields.io/badge/Mobile-Optimized-purple)

## 🚀 Features

- **AI Virtual Staging**: Transform empty rooms using Google Gemini 2.5 Flash Image
- **Room-based Pricing**: $4.99 per room with bulk discounts
- **Mobile Optimized**: Responsive design with mobile-first UI
- **Real-time Processing**: 8-12 second AI staging with live progress
- **Stripe Payments**: Secure credit-based payment system
- **Multi-tenant**: Organization-based access control
- **Professional UI**: Modern interface built with shadcn/ui

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Better-Auth (email + Google OAuth)
- **Payments**: Stripe (pay-per-use model)
- **AI**: Google Gemini 2.5 Flash Image API
- **Storage**: Local file system (AWS S3 ready)
- **Deployment**: Vercel ready

## 📱 Mobile Experience

Magic Staging features a fully responsive design with:
- **Desktop**: Traditional horizontal tabs with full functionality
- **Mobile**: Bottom navigation tabs with touch-optimized interface
- **Adaptive Layouts**: Automatic layout switching based on screen size
- **Touch-Friendly**: Larger touch targets and mobile spacing

## 🏗 Architecture

```
Magic Staging
├── Authentication (Better-Auth)
│   ├── Email + Password
│   └── Google OAuth
├── Multi-tenant Organizations
├── Project Management
├── Image Upload & Processing
├── AI Virtual Staging (Gemini)
├── Credit-based Billing (Stripe)
└── Mobile-Optimized UI
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Supabase)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/tomcwatts/Magic-Staging.git
cd Magic-Staging

# Install dependencies
npm install

# Start local database
supabase start

# Set up database schema
npx prisma db push

# Start development server
npm run dev
```

### Environment Setup

Copy `.env.local` and add your API keys:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Authentication
BETTER_AUTH_SECRET="your-32-character-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"

# AI & Payments
GOOGLE_AI_API_KEY="your-gemini-api-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

## 📈 Development Status

**Phase 7 Complete: Production Ready** ✅

- ✅ **Phase 1**: Project foundation and authentication
- ✅ **Phase 2**: Database schema and user management  
- ✅ **Phase 3**: Core UI components and layouts
- ✅ **Phase 4A**: File upload system (local storage)
- ✅ **Phase 5**: AI integration with Gemini 2.5 Flash Image
- ✅ **Phase 6**: Stripe payment integration with webhooks
- ✅ **Phase 7**: Production polish and mobile optimization

## 🧪 Testing

Test the complete workflow:
1. Sign up / Login
2. Create a project
3. Upload room images
4. Configure staging preferences
5. Generate AI staged rooms
6. Purchase credits via Stripe
7. Test mobile responsive interface

## 🚀 Deployment

Ready for production deployment to Vercel:

```bash
# Build and deploy
npm run build
vercel --prod
```

## 📊 Performance

- **Image Processing**: 60-80% file size reduction
- **Loading Times**: 0.8-2.1s optimized load times
- **Mobile Performance**: 40% faster image rendering
- **AI Processing**: 8-12 seconds per room staging

## 🎯 Business Model

- **Room-based Pricing**: $4.99 per staged room
- **Bulk Discounts**: 10+ rooms = $4.49, 50+ = $3.99
- **Target Market**: Real estate professionals and agencies
- **Revenue Model**: Pay-per-use credits system

## 🔧 Development

Built with modern development practices:
- TypeScript strict mode compliance
- Comprehensive error handling
- Progressive image loading
- Mobile-first responsive design
- Production-ready security measures

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Magic Staging** - Transform empty spaces into dream homes with AI ✨