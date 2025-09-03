# Magic Staging: Complete AI Development Guide

## Overview
This guide provides step-by-step instructions for building Magic Staging, an AI-powered virtual staging SaaS application. Each section builds methodically on the previous, creating a complete, production-ready application.

**Tech Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Better-Auth, Stripe, AWS S3, Google Gemini AI, Tailwind CSS, shadcn/ui

**Target Features**: Room-based pricing ($4.99/room), AI virtual staging, user management, payment processing, file storage

---

## ✅ Phase 3.5: AI Validation Spike (COMPLETED)

**🎉 VALIDATION SUCCESSFUL!** Before continuing with production infrastructure, we validated the core AI concept.

### What Was Validated:
- ✅ **Gemini 2.5 Flash Image Preview** successfully generates realistic staged room images
- ✅ **Processing time** is reasonable (~10 seconds per image)
- ✅ **Image quality** is excellent and market-ready
- ✅ **Style variations** work (modern, traditional, minimalist)
- ✅ **Custom prompts** are interpreted correctly

### Validation Implementation:
- **Test Page**: `/test-ai` - Simple validation interface
- **API Route**: `/api/test-staging` - Basic image processing  
- **AI Service**: `lib/gemini-simple.ts` - Direct Gemini integration
- **File Storage**: Local `/public/uploads/` (temporary)

### Key Learnings:
- **Critical Model**: Must use `gemini-2.5-flash-image-preview` (not regular `gemini-2.5-flash`)
- **Image Generation Works**: AI produces photorealistic staged rooms
- **Cost Effective**: ~$0.039 per generated image
- **Fast Processing**: 8-12 seconds per room staging

### Files Created (Now Merged to Main):
```
app/test-ai/page.tsx                 # Validation UI
app/api/test-staging/route.ts        # Test API endpoint
lib/gemini-simple.ts                 # Simplified AI service
components/layout/navbar.tsx         # Added test link
```

This validation saved weeks of infrastructure work by proving the concept works before building production systems.

---

## Phase 1: Project Foundation Setup

### 1.1 Environment Setup
- [x] Create project directory structure
- [x] Initialize Next.js 15 application with TypeScript
- [x] Configure essential dependencies
- [x] Set up development environment

**Commands to Execute:**
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --use-npm
cd frontend
```

**Dependencies to Install:**
```bash
npm install @prisma/client prisma better-auth zod zustand
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
npm install lucide-react sonner react-dropzone @uppy/react @uppy/core @uppy/xhr-upload
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
npm install @google/generative-ai @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install resend
npm install -D @types/node
```

**shadcn/ui Setup:**
```bash
npx shadcn@latest init
npx shadcn@latest add button dialog dropdown-menu card badge toast
npx shadcn@latest add form input label textarea select table
npx shadcn@latest add avatar progress separator sheet tabs
```

### 1.2 Environment Configuration
- [x] Create comprehensive .env.local file
- [x] Configure all required environment variables
- [x] Set up local development secrets

**Create `.env.local`:**
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Better Auth
BETTER_AUTH_SECRET="your-secure-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_S3_BUCKET_NAME="magicstaging-storage-dev"

# Google AI (Gemini)
GOOGLE_AI_API_KEY="your_google_ai_api_key"

# Email
RESEND_API_KEY="your_resend_api_key"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 1.3 Database Setup (Supabase Local)
- [x] Install Supabase CLI
- [x] Initialize Supabase project
- [x] Start local Supabase instance
- [x] Configure database connection

**Commands:**
```bash
# Install Supabase CLI (macOS)
brew install supabase/tap/supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start
```

**Verification Steps:**
- [x] Supabase running at http://localhost:54323
- [x] Database accessible at postgresql://postgres:postgres@localhost:54322/postgres
- [x] All services green in `supabase status`

---

## Phase 2: Database Schema & Authentication

### 2.1 Database Schema Implementation
- [x] Create complete Prisma schema
- [x] Configure database relationships
- [x] Set up indexes for performance
- [x] Generate Prisma client

**Create `prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Better-Auth fields
  emailVerified DateTime?

  // Relations
  organizations OrganizationMember[]
  createdJobs   StagingJob[]
  usageLogs     UsageLog[]

  @@map("users")
}

model Organization {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  creditsRemaining Int      @default(10)
  planType         String   @default("individual") // individual, agency, enterprise
  stripeCustomerId String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  members      OrganizationMember[]
  projects     Project[]
  roomImages   RoomImage[]
  stagingJobs  StagingJob[]
  stagedImages StagedImage[]
  transactions Transaction[]
  usageLogs    UsageLog[]

  @@map("organizations")
}

model OrganizationMember {
  id             String   @id @default(cuid())
  organizationId String
  userId         String
  role           String   @default("member") // owner, admin, member
  createdAt      DateTime @default(now())

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@map("organization_members")
}

model Project {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  address        String?
  mlsNumber      String?
  propertyType   String?  // house, condo, commercial
  status         String   @default("active") // active, archived, completed
  createdBy      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  roomImages   RoomImage[]

  @@map("projects")
}

model RoomImage {
  id             String   @id @default(cuid())
  projectId      String
  organizationId String
  filename       String
  s3Key          String
  s3Url          String
  fileSize       Int?
  mimeType       String?
  width          Int?
  height         Int?
  roomType       String? // living_room, bedroom, kitchen, etc.
  uploadStatus   String   @default("uploaded") // uploaded, processing, ready
  createdBy      String?
  createdAt      DateTime @default(now())

  // Relations
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  stagingJobs  StagingJob[]

  @@map("room_images")
}

model StagingJob {
  id                     String    @id @default(cuid())
  roomImageId            String
  organizationId         String
  prompt                 String
  stylePreferences       Json?     // {"style": "modern", "colors": ["white", "gray"]}
  status                 String    @default("pending") // pending, processing, completed, failed
  aiModel                String    @default("gemini-2.5-flash-image-preview")
  aiCostCents            Int?
  processingStartedAt    DateTime?
  processingCompletedAt  DateTime?
  errorMessage           String?
  createdBy              String?
  createdAt              DateTime  @default(now())

  // Relations
  roomImage    RoomImage      @relation(fields: [roomImageId], references: [id], onDelete: Cascade)
  organization Organization   @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?          @relation(fields: [createdBy], references: [id])
  stagedImages StagedImage[]

  @@map("staging_jobs")
}

model StagedImage {
  id             String   @id @default(cuid())
  stagingJobId   String
  organizationId String
  s3Key          String
  s3Url          String
  width          Int?
  height         Int?
  fileSize       Int?
  aiMetadata     Json?
  qualityScore   Decimal? @db.Decimal(3, 2)
  isApproved     Boolean  @default(false)
  createdAt      DateTime @default(now())

  // Relations
  stagingJob   StagingJob   @relation(fields: [stagingJobId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("staged_images")
}

model Transaction {
  id                     String   @id @default(cuid())
  organizationId         String
  stripePaymentIntentId  String?
  amountCents            Int
  currency               String   @default("USD")
  status                 String // succeeded, failed, pending
  roomsPurchased         Int
  description            String?
  createdAt              DateTime @default(now())

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("transactions")
}

model UsageLog {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String?
  action          String // room_staged, image_downloaded, etc.
  resourceId      String?
  aiCostCents     Int?
  billableCredits Int      @default(1)
  createdAt       DateTime @default(now())

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])

  @@map("usage_logs")
}
```

**Database Commands:**
```bash
npx prisma generate
npx prisma db push
```

**Verification Steps:**
- [x] Prisma client generated successfully
- [x] Database schema pushed without errors
- [x] All tables created in Supabase dashboard
- [x] Can run `npx prisma studio` successfully

### 2.2 Better-Auth Implementation
- [x] Configure Better-Auth with Prisma adapter
- [x] Set up authentication providers (email, Google)
- [x] Create auth API routes
- [x] Implement client-side auth helpers

**Create `lib/auth.ts`:**
```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  advanced: {
    generateId: () => {
      // Use cuid for consistent ID generation
      return crypto.randomUUID();
    },
  },
  plugins: [],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

**Create `lib/auth-client.ts`:**
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**Create `app/api/auth/[...all]/route.ts`:**
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/nextjs";

const handler = toNextJsHandler(auth);

export { handler as GET, handler as POST };
```

**Create `lib/db.ts`:**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Verification Steps:**
- [x] Auth API routes respond at `/api/auth/*`
- [x] Better-Auth configuration loads without errors
- [x] Database adapter connects successfully

### 2.3 Authentication Middleware & Utils
- [x] Create authentication middleware
- [x] Build session management utilities
- [x] Implement route protection
- [x] Add organization context helpers

**Create `middleware.ts`:**
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Check if accessing protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    } catch (error) {
      console.error("Session check failed:", error);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
  ],
};
```

**Create `lib/auth-utils.ts`:**
```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: headers(),
    });
    return session?.user || null;
  } catch {
    return null;
  }
}

export async function getCurrentUserWithOrg() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orgMember = await db.organizationMember.findFirst({
    where: { userId: user.id },
    include: {
      organization: true,
    },
  });

  return {
    user,
    organization: orgMember?.organization || null,
    role: orgMember?.role || null,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireAuthWithOrg() {
  const userWithOrg = await getCurrentUserWithOrg();
  if (!userWithOrg?.user) {
    throw new Error("Authentication required");
  }
  if (!userWithOrg.organization) {
    throw new Error("Organization membership required");
  }
  return userWithOrg;
}
```

---

## Phase 3: Core UI Components & Layout

### 3.1 Base Layout & Navigation
- [X] Create main application layout
- [X] Implement responsive navigation
- [X] Add user profile dropdown
- [X] Set up route structure

**Create `app/layout.tsx`:**
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Magic Staging - AI Virtual Staging",
  description: "Transform empty rooms with AI-powered virtual staging for real estate professionals",
  keywords: "virtual staging, real estate, AI, property marketing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Create `components/layout/navbar.tsx`:**
```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { LogOut, User, Settings, CreditCard } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Magic Staging
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>
                          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Create `components/layout/sidebar.tsx`:**
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  FolderOpen,
  Image,
  CreditCard,
  Settings,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Staged Images", href: "/dashboard/images", icon: Image },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50">
      <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500",
                    "mr-3 flex-shrink-0 h-6 w-6"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
```

### 3.2 Authentication Components
- [X] Build sign-in form component
- [X] Create sign-up form component
- [X] Add social authentication buttons
- [X] Implement form validation

**Create `components/auth/sign-in-form.tsx`:**
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message || "Sign in failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Google sign in failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your Magic Staging account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Create `app/sign-in/page.tsx`:**
```typescript
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
        </div>
        
        <SignInForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 Dashboard Layout
- [X] Create dashboard layout wrapper
- [X] Implement responsive sidebar
- [X] Add dashboard header with organization info
- [X] Set up main content area

**Create `app/dashboard/layout.tsx`:**
```typescript
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Create `app/dashboard/page.tsx`:**
```typescript
import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userWithOrg.user.name || "there"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your virtual staging projects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Credits Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userWithOrg.organization?.creditsRemaining || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Room stagings available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Properties being staged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staged Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Total completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plan Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="secondary">
                {userWithOrg.organization?.planType || "Individual"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Current subscription
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your first virtual staging project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to transform empty rooms?
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first project and upload room photos to get started with AI virtual staging.
            </p>
            {/* We'll add the actual button functionality in later phases */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Verification Steps:**
- [ ] Dashboard accessible at `/dashboard`
- [ ] Navigation works correctly
- [ ] User authentication enforced
- [ ] Responsive layout functions properly
- [ ] All UI components render without errors

---

## Phase 4: File Upload & Storage System

### 4.1 AWS S3 Integration
- [ ] Configure AWS S3 SDK
- [ ] Implement presigned URL generation
- [ ] Create secure upload utilities
- [ ] Set up file naming conventions

**Create `lib/s3.ts`:**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Generate presigned URL for secure uploads
export async function generatePresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: 'private',
    ServerSideEncryption: 'AES256',
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Generate structured S3 key
export function generateS3Key(
  organizationId: string,
  projectId: string,
  filename: string,
  type: 'original' | 'staged' = 'original'
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${type}/${organizationId}/${projectId}/${timestamp}_${sanitizedFilename}`;
}

// Upload buffer directly (for AI-generated images)
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private',
    ServerSideEncryption: 'AES256',
  });

  await s3Client.send(command);
  
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Generate presigned URL for downloads
export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

### 4.2 File Upload API Routes
- [ ] Create presigned URL generation endpoint
- [ ] Build file metadata saving endpoint
- [ ] Add file validation and security
- [ ] Implement upload completion handling

**Create `app/api/upload/presigned-url/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generatePresignedUrl, generateS3Key } from "@/lib/s3";
import { requireAuthWithOrg } from "@/lib/auth-utils";

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  projectId: z.string().cuid(),
  roomType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = uploadRequestSchema.parse(body);

    // Generate unique S3 key
    const s3Key = generateS3Key(
      userWithOrg.organization.id,
      validatedData.projectId,
      validatedData.filename
    );

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(
      s3Key,
      validatedData.contentType
    );

    const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      presignedUrl,
      s3Key,
      s3Url,
    });

  } catch (error) {
    console.error("Presigned URL generation failed:", error);
    return NextResponse.json(
      { error: "Upload setup failed" },
      { status: 500 }
    );
  }
}
```

**Create `app/api/upload/complete/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuthWithOrg } from "@/lib/auth-utils";

const uploadCompleteSchema = z.object({
  projectId: z.string().cuid(),
  filename: z.string(),
  s3Key: z.string(),
  s3Url: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  roomType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = uploadCompleteSchema.parse(body);

    // Verify project belongs to user's organization
    const project = await db.project.findFirst({
      where: {
        id: validatedData.projectId,
        organizationId: userWithOrg.organization.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Save room image to database
    const roomImage = await db.roomImage.create({
      data: {
        projectId: validatedData.projectId,
        organizationId: userWithOrg.organization.id,
        filename: validatedData.filename,
        s3Key: validatedData.s3Key,
        s3Url: validatedData.s3Url,
        fileSize: validatedData.fileSize,
        mimeType: validatedData.mimeType,
        width: validatedData.width,
        height: validatedData.height,
        roomType: validatedData.roomType,
        createdBy: userWithOrg.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      roomImageId: roomImage.id,
    });

  } catch (error) {
    console.error("Upload completion failed:", error);
    return NextResponse.json(
      { error: "Upload completion failed" },
      { status: 500 }
    );
  }
}
```

### 4.3 Image Upload Component
- [ ] Build drag-and-drop upload interface
- [ ] Add upload progress tracking
- [ ] Implement image preview functionality
- [ ] Handle upload errors gracefully

**Create `components/upload/image-upload.tsx`:**
```typescript
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface UploadFile {
  file: File;
  preview: string;
  s3Key?: string;
  s3Url?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  roomImageId?: string;
}

interface ImageUploadProps {
  projectId: string;
  onUploadComplete?: (roomImageId: string) => void;
  maxFiles?: number;
}

export function ImageUpload({ projectId, onUploadComplete, maxFiles = 10 }: ImageUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const { toast } = useToast();

  const uploadFile = async (fileItem: UploadFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.file === fileItem.file 
          ? { ...f, status: 'uploading' as const }
          : f
      ));

      // Step 1: Get presigned URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileItem.file.name,
          contentType: fileItem.file.type,
          fileSize: fileItem.file.size,
          projectId,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { presignedUrl, s3Key, s3Url } = await presignedResponse.json();

      // Update file with S3 info
      setFiles(prev => prev.map(f => 
        f.file === fileItem.file 
          ? { ...f, s3Key, s3Url }
          : f
      ));

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: fileItem.file,
        headers: {
          'Content-Type': fileItem.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Complete upload on our server
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename: fileItem.file.name,
          s3Key,
          s3Url,
          fileSize: fileItem.file.size,
          mimeType: fileItem.file.type,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      const { roomImageId } = await completeResponse.json();

      // Update file status
      setFiles(prev => prev.map(f => 
        f.file === fileItem.file 
          ? { ...f, status: 'completed' as const, uploadProgress: 100, roomImageId }
          : f
      ));

      onUploadComplete?.(roomImageId);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

    } catch (error) {
      console.error('Upload failed:', error);
      
      setFiles(prev => prev.map(f => 
        f.file === fileItem.file 
          ? { ...f, status: 'error' as const }
          : f
      ));

      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploadProgress: 0,
      status: 'pending' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading each file
    newFiles.forEach(uploadFile);
  }, [projectId]);

  const removeFile = (fileToRemove: UploadFile) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove.file));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: maxFiles - files.length,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive 
                  ? 'Drop room images here...' 
                  : 'Upload room images'
                }
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop images, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports JPG, PNG, WebP • Max 10MB per file • Up to {maxFiles} files
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((fileItem, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeFile(fileItem)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                {fileItem.status === 'completed' && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                      ✓ Uploaded
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  <p className="font-medium text-sm truncate">{fileItem.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {fileItem.status === 'uploading' && (
                    <Progress value={fileItem.uploadProgress} className="h-1" />
                  )}
                  
                  {fileItem.status === 'error' && (
                    <p className="text-xs text-red-500">Upload failed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.4 Project Management
- [ ] Create project creation functionality
- [ ] Build project listing interface
- [ ] Add project detail views
- [ ] Implement project management actions

**Create `app/api/projects/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuthWithOrg } from "@/lib/auth-utils";

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().optional(),
  mlsNumber: z.string().optional(),
  propertyType: z.enum(['house', 'condo', 'commercial']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        ...validatedData,
        organizationId: userWithOrg.organization.id,
        createdBy: userWithOrg.user.id,
      },
    });

    return NextResponse.json({ project });

  } catch (error) {
    console.error("Project creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();

    const projects = await db.project.findMany({
      where: {
        organizationId: userWithOrg.organization.id,
      },
      include: {
        roomImages: true,
        _count: {
          select: {
            roomImages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects });

  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
```

**Create `app/dashboard/projects/page.tsx`:**
```typescript
import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FolderOpen, Image } from "lucide-react";

export default async function ProjectsPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  const projects = await db.project.findMany({
    where: {
      organizationId: userWithOrg.organization.id,
    },
    include: {
      _count: {
        select: {
          roomImages: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your virtual staging projects
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first project to start staging rooms with AI
            </p>
            <Button asChild>
              <Link href="/dashboard/projects/new">
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant="secondary">{project.status}</Badge>
                </div>
                {project.address && (
                  <CardDescription>{project.address}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Image className="mr-1 h-4 w-4" />
                    {project._count.roomImages} rooms
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Verification Steps:**
- [ ] File upload component renders correctly
- [ ] Image drag-and-drop functionality works
- [ ] Files upload to S3 successfully
- [ ] Upload progress tracking functions
- [ ] File metadata saves to database
- [ ] Project creation works properly
- [ ] Projects list displays correctly

---

## Phase 5: AI Integration (Gemini 2.5 Flash Image)

### 5.1 Gemini AI Service Implementation
- [ ] Configure Google AI SDK
- [ ] Build AI staging service
- [ ] Implement prompt optimization
- [ ] Add error handling and retries

**Create `lib/gemini.ts`:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Get Gemini 2.5 Flash Image model
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-image-preview" 
});

export interface StagingRequest {
  imageBuffer: Buffer;
  prompt: string;
  style?: 'modern' | 'traditional' | 'minimalist' | 'luxury' | 'contemporary' | 'rustic';
  roomType?: 'living_room' | 'bedroom' | 'kitchen' | 'dining_room' | 'bathroom' | 'office' | 'other';
  preferences?: {
    colors?: string[];
    furnitureCount?: 'minimal' | 'moderate' | 'full';
    budget?: 'economy' | 'mid_range' | 'luxury';
  };
}

export interface StagingResult {
  imageBuffer: Buffer;
  metadata: {
    model: string;
    prompt: string;
    style: string;
    roomType?: string;
    processingTime: number;
    estimatedCost: number;
  };
  success: boolean;
}

export async function stageRoom(request: StagingRequest): Promise<StagingResult> {
  const startTime = Date.now();
  
  try {
    // Build optimized prompt
    const optimizedPrompt = buildStagingPrompt(
      request.prompt,
      request.style || 'modern',
      request.roomType,
      request.preferences
    );

    // Convert buffer to format Gemini expects
    const imagePart = {
      inlineData: {
        data: request.imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    // Generate staged image
    const result = await model.generateContent({
      contents: [{
        parts: [
          { text: optimizedPrompt },
          imagePart
        ]
      }]
    });

    // Extract generated image
    const generatedImageBuffer = await extractImageFromResponse(result);
    
    const processingTime = Date.now() - startTime;

    return {
      imageBuffer: generatedImageBuffer,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        prompt: optimizedPrompt,
        style: request.style || 'modern',
        roomType: request.roomType,
        processingTime,
        estimatedCost: 0.039, // $0.039 per image based on Gemini pricing
      },
      success: true,
    };

  } catch (error) {
    console.error('AI staging failed:', error);
    
    const processingTime = Date.now() - startTime;
    
    // Return error result
    return {
      imageBuffer: Buffer.alloc(0),
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        prompt: request.prompt,
        style: request.style || 'modern',
        roomType: request.roomType,
        processingTime,
        estimatedCost: 0,
      },
      success: false,
    };
  }
}

function buildStagingPrompt(
  basePrompt: string,
  style: string,
  roomType?: string,
  preferences?: StagingRequest['preferences']
): string {
  let prompt = "Transform this empty room into a professionally staged space. ";

  // Add room type context
  if (roomType) {
    const roomContext = {
      living_room: "This is a living room that should be welcoming and comfortable for families and guests.",
      bedroom: "This is a bedroom that should feel restful and peaceful.",
      kitchen: "This is a kitchen space that should appear functional and inviting.",
      dining_room: "This is a dining room that should encourage gathering and meals.",
      bathroom: "This is a bathroom that should feel clean, spa-like, and luxurious.",
      office: "This is an office space that should feel professional and productive.",
      other: "Stage this room appropriately for its intended function."
    };
    prompt += roomContext[roomType] + " ";
  }

  // Add style guidelines
  const styleGuides = {
    modern: "Use clean lines, neutral colors (whites, grays, blacks), minimal contemporary furniture, and modern lighting fixtures.",
    traditional: "Include classic furniture pieces, warm colors (browns, creams, navy), traditional patterns, and elegant accessories.",
    minimalist: "Use very minimal furniture with lots of white space, simple geometric forms, and maximum 3-4 carefully chosen pieces.",
    luxury: "Add high-end furniture, rich materials (marble, hardwood, leather), sophisticated color palette, and premium accessories.",
    contemporary: "Blend modern and traditional elements with current design trends, mixed textures, and statement pieces.",
    rustic: "Include natural wood elements, warm earth tones, cozy textures, and farmhouse-style accessories."
  };

  prompt += styleGuides[style] || styleGuides.modern;
  prompt += " ";

  // Add preferences if provided
  if (preferences) {
    if (preferences.colors && preferences.colors.length > 0) {
      prompt += `Incorporate these colors: ${preferences.colors.join(', ')}. `;
    }

    if (preferences.furnitureCount) {
      const furnitureGuides = {
        minimal: "Use only essential furniture pieces to avoid clutter.",
        moderate: "Include a comfortable amount of furniture without overcrowding.",
        full: "Fully furnish the space with all necessary and decorative pieces."
      };
      prompt += furnitureGuides[preferences.furnitureCount] + " ";
    }

    if (preferences.budget) {
      const budgetGuides = {
        economy: "Focus on affordable, practical furniture choices.",
        mid_range: "Balance quality and cost with mid-tier furniture selections.",
        luxury: "Use high-end, designer-quality furniture and accessories."
      };
      prompt += budgetGuides[preferences.budget] + " ";
    }
  }

  // Add technical requirements
  prompt += "Ensure realistic lighting that matches the original room's windows and fixtures. ";
  prompt += "Maintain accurate perspective and scale. ";
  prompt += "Add appropriate shadows under furniture. ";
  prompt += "Make all additions look naturally placed and proportional. ";

  // Add custom prompt
  if (basePrompt.trim()) {
    prompt += `Additional requirements: ${basePrompt} `;
  }

  // Final quality instructions
  prompt += "The result should look professional, photorealistic, and market-ready for real estate listings.";

  return prompt;
}

async function extractImageFromResponse(result: any): Promise<Buffer> {
  try {
    // This implementation depends on Gemini's actual response format
    // The exact structure may vary - this is a placeholder implementation
    
    if (result.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      const imageData = result.response.candidates[0].content.parts[0].inlineData.data;
      return Buffer.from(imageData, 'base64');
    }
    
    throw new Error('No image data found in AI response');
    
  } catch (error) {
    console.error('Failed to extract image from AI response:', error);
    throw new Error('Failed to process AI-generated image');
  }
}

// Utility function to validate image buffer
export function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) return false;
  
  // Check for common image file signatures
  const jpegSignature = buffer.slice(0, 3);
  const pngSignature = buffer.slice(0, 8);
  
  return (
    jpegSignature.equals(Buffer.from([0xFF, 0xD8, 0xFF])) ||
    pngSignature.equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))
  );
}
```

### 5.2 AI Processing API Routes
- [ ] Create staging job creation endpoint
- [ ] Build staging processing endpoint
- [ ] Add job status tracking
- [ ] Implement result retrieval

**Create `app/api/staging/create/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuthWithOrg } from "@/lib/auth-utils";

const createStagingJobSchema = z.object({
  roomImageId: z.string().cuid(),
  prompt: z.string().max(1000),
  style: z.enum(['modern', 'traditional', 'minimalist', 'luxury', 'contemporary', 'rustic']).default('modern'),
  preferences: z.object({
    colors: z.array(z.string()).optional(),
    furnitureCount: z.enum(['minimal', 'moderate', 'full']).optional(),
    budget: z.enum(['economy', 'mid_range', 'luxury']).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const validatedData = createStagingJobSchema.parse(body);

    // Check if organization has sufficient credits
    if (userWithOrg.organization.creditsRemaining < 1) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          creditsRemaining: userWithOrg.organization.creditsRemaining 
        },
        { status: 402 }
      );
    }

    // Verify room image exists and belongs to user's organization
    const roomImage = await db.roomImage.findFirst({
      where: {
        id: validatedData.roomImageId,
        organizationId: userWithOrg.organization.id,
      },
      include: {
        project: true,
      }
    });

    if (!roomImage) {
      return NextResponse.json(
        { error: "Room image not found" },
        { status: 404 }
      );
    }

    // Create staging job
    const stagingJob = await db.stagingJob.create({
      data: {
        roomImageId: validatedData.roomImageId,
        organizationId: userWithOrg.organization.id,
        prompt: validatedData.prompt,
        stylePreferences: validatedData.preferences || {},
        status: 'pending',
        createdBy: userWithOrg.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      stagingJobId: stagingJob.id,
    });

  } catch (error) {
    console.error("Staging job creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create staging job" },
      { status: 500 }
    );
  }
}
```

**Create `app/api/staging/process/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuthWithOrg } from "@/lib/auth-utils";
import { stageRoom } from "@/lib/gemini";
import { uploadBuffer, generateS3Key } from "@/lib/s3";

const processStagingSchema = z.object({
  stagingJobId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const { stagingJobId } = processStagingSchema.parse(body);

    // Get staging job with room image
    const stagingJob = await db.stagingJob.findFirst({
      where: {
        id: stagingJobId,
        organizationId: userWithOrg.organization.id,
        status: 'pending',
      },
      include: {
        roomImage: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!stagingJob) {
      return NextResponse.json(
        { error: "Staging job not found or already processed" },
        { status: 404 }
      );
    }

    // Update job status to processing
    await db.stagingJob.update({
      where: { id: stagingJobId },
      data: {
        status: 'processing',
        processingStartedAt: new Date(),
      },
    });

    try {
      // Download original image from S3
      const imageResponse = await fetch(stagingJob.roomImage.s3Url);
      if (!imageResponse.ok) {
        throw new Error('Failed to download original image');
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      // Process with AI
      const stagingResult = await stageRoom({
        imageBuffer,
        prompt: stagingJob.prompt,
        style: (stagingJob.stylePreferences as any)?.style || 'modern',
        roomType: stagingJob.roomImage.roomType as any,
        preferences: stagingJob.stylePreferences as any,
      });

      if (!stagingResult.success) {
        throw new Error('AI staging failed');
      }

      // Generate S3 key for staged image
      const stagedS3Key = generateS3Key(
        userWithOrg.organization.id,
        stagingJob.roomImage.projectId,
        `staged_${stagingJob.roomImage.filename}`,
        'staged'
      );

      // Upload staged image to S3
      const stagedS3Url = await uploadBuffer(
        stagingResult.imageBuffer,
        stagedS3Key,
        'image/jpeg'
      );

      // Create staged image record
      const stagedImage = await db.stagedImage.create({
        data: {
          stagingJobId,
          organizationId: userWithOrg.organization.id,
          s3Key: stagedS3Key,
          s3Url: stagedS3Url,
          fileSize: stagingResult.imageBuffer.length,
          aiMetadata: stagingResult.metadata,
        },
      });

      // Update staging job as completed
      await db.stagingJob.update({
        where: { id: stagingJobId },
        data: {
          status: 'completed',
          processingCompletedAt: new Date(),
          aiCostCents: Math.round(stagingResult.metadata.estimatedCost * 100),
        },
      });

      // Deduct credits and log usage
      await Promise.all([
        db.organization.update({
          where: { id: userWithOrg.organization.id },
          data: { creditsRemaining: { decrement: 1 } }
        }),
        db.usageLog.create({
          data: {
            organizationId: userWithOrg.organization.id,
            userId: userWithOrg.user.id,
            action: 'room_staged',
            resourceId: stagingJobId,
            aiCostCents: Math.round(stagingResult.metadata.estimatedCost * 100),
            billableCredits: 1,
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        stagingJobId,
        stagedImageId: stagedImage.id,
        stagedImageUrl: stagedS3Url,
        processingTime: stagingResult.metadata.processingTime,
      });

    } catch (processingError) {
      console.error('Staging processing error:', processingError);

      // Update job as failed
      await db.stagingJob.update({
        where: { id: stagingJobId },
        data: {
          status: 'failed',
          errorMessage: processingError instanceof Error ? processingError.message : 'Processing failed',
          processingCompletedAt: new Date(),
        },
      });

      return NextResponse.json(
        { error: "AI processing failed" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Staging process failed:", error);
    return NextResponse.json(
      { error: "Staging process failed" },
      { status: 500 }
    );
  }
}
```

### 5.3 Staging Interface Components
- [ ] Build staging request form
- [ ] Create progress tracking component
- [ ] Add result display interface
- [ ] Implement comparison view

**Create `components/staging/staging-form.tsx`:**
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface StagingFormProps {
  roomImageId: string;
  onStagingComplete?: (result: any) => void;
}

export function StagingForm({ roomImageId, onStagingComplete }: StagingFormProps) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("modern");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create staging job
      const createResponse = await fetch('/api/staging/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImageId,
          prompt,
          style,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create staging job');
      }

      const { stagingJobId } = await createResponse.json();

      toast({
        title: "Staging Started",
        description: "Your room is being transformed with AI...",
      });

      // Process staging
      const processResponse = await fetch('/api/staging/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagingJobId,
        }),
      });

      if (!processResponse.ok) {
        const error = await processResponse.json();
        throw new Error(error.error || 'Failed to process staging');
      }

      const result = await processResponse.json();

      toast({
        title: "Staging Complete!",
        description: "Your staged room is ready for viewing.",
      });

      onStagingComplete?.(result);

    } catch (error) {
      console.error('Staging failed:', error);
      toast({
        title: "Staging Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Virtual Staging
        </CardTitle>
        <CardDescription>
          Transform this empty room with AI-powered furniture and decor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a staging style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="contemporary">Contemporary</SelectItem>
                <SelectItem value="rustic">Rustic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="Add specific requests like 'include a dining table for 6' or 'use warm colors'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={isProcessing}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Staging Room...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Stage Room ($4.99)
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Processing typically takes 30-60 seconds
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Verification Steps:**
- [ ] Gemini AI service initializes correctly
- [ ] Staging job creation works
- [ ] AI processing completes successfully
- [ ] Generated images save to S3
- [ ] Database records update properly
- [ ] Credits are deducted correctly
- [ ] Staging form functions as expected

---

## Phase 6: Payment Processing (Stripe Integration)

### 6.1 Stripe Configuration & Utilities
- [ ] Set up Stripe SDK configuration
- [ ] Create pricing calculation utilities
- [ ] Build customer management functions
- [ ] Implement webhook signature verification

**Create `lib/stripe.ts`:**
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Pricing configuration
export const PRICING = {
  ROOM_STAGING: {
    base_price: 499, // $4.99 in cents
    bulk_discounts: {
      10: 449, // $4.49 for 10+ rooms
      50: 399, // $3.99 for 50+ rooms
      100: 349, // $3.49 for 100+ rooms
    }
  }
} as const;

export function calculateRoomStagingPrice(quantity: number): {
  totalCents: number;
  pricePerRoomCents: number;
  discountApplied: boolean;
  discountPercentage?: number;
} {
  let pricePerRoom = PRICING.ROOM_STAGING.base_price;
  let discountApplied = false;
  let discountPercentage: number | undefined;

  // Apply bulk discounts
  if (quantity >= 100) {
    pricePerRoom = PRICING.ROOM_STAGING.bulk_discounts[100];
    discountApplied = true;
    discountPercentage = Math.round((1 - pricePerRoom / PRICING.ROOM_STAGING.base_price) * 100);
  } else if (quantity >= 50) {
    pricePerRoom = PRICING.ROOM_STAGING.bulk_discounts[50];
    discountApplied = true;
    discountPercentage = Math.round((1 - pricePerRoom / PRICING.ROOM_STAGING.base_price) * 100);
  } else if (quantity >= 10) {
    pricePerRoom = PRICING.ROOM_STAGING.bulk_discounts[10];
    discountApplied = true;
    discountPercentage = Math.round((1 - pricePerRoom / PRICING.ROOM_STAGING.base_price) * 100);
  }

  return {
    totalCents: quantity * pricePerRoom,
    pricePerRoomCents: pricePerRoom,
    discountApplied,
    discountPercentage,
  };
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        userId: userId,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Failed to get or create Stripe customer:', error);
    throw new Error('Customer setup failed');
  }
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
```

### 6.2 Payment Intent & Checkout API Routes
- [ ] Create payment intent generation
- [ ] Build checkout session creation
- [ ] Add payment confirmation handling
- [ ] Implement credit allocation logic

**Create `app/api/payments/create-intent/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, calculateRoomStagingPrice, getOrCreateStripeCustomer } from "@/lib/stripe";
import { requireAuthWithOrg } from "@/lib/auth-utils";
import { db } from "@/lib/db";

const createPaymentIntentSchema = z.object({
  quantity: z.number().min(1).max(1000),
  projectId: z.string().cuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await requireAuthWithOrg();
    const body = await request.json();
    const { quantity, projectId } = createPaymentIntentSchema.parse(body);

    // Calculate pricing
    const pricing = calculateRoomStagingPrice(quantity);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userWithOrg.user.id,
      userWithOrg.user.email!
    );

    // Update organization with customer ID if not set
    if (!userWithOrg.organization.stripeCustomerId) {
      await db.organization.update({
        where: { id: userWithOrg.organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.totalCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        organizationId: userWithOrg.organization.id,
        userId: userWithOrg.user.id,
        quantity: quantity.toString(),
        pricePerRoom: pricing.pricePerRoomCents.toString(),
        projectId: projectId || '',
      },
      description: `${quantity} room staging credit${quantity > 1 ? 's' : ''}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: pricing.totalCents,
      quantity,
      pricePerRoom: pricing.pricePerRoomCents,
      discountApplied: pricing.discountApplied,
      discountPercentage: pricing.discountPercentage,
    });

  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: 'Payment setup failed' },
      { status: 500 }
    );
  }
}
```

**Create `app/api/webhooks/stripe/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const organizationId = paymentIntent.metadata.organizationId;
  const quantity = parseInt(paymentIntent.metadata.quantity);

  if (!organizationId || !quantity) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  try {
    await db.$transaction([
      // Create transaction record
      db.transaction.create({
        data: {
          organizationId,
          stripePaymentIntentId: paymentIntent.id,
          amountCents: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          status: 'succeeded',
          roomsPurchased: quantity,
          description: `${quantity} room staging credit${quantity > 1 ? 's' : ''}`,
        },
      }),

      // Add credits to organization
      db.organization.update({
        where: { id: organizationId },
        data: {
          creditsRemaining: { increment: quantity },
        },
      }),

      // Log the purchase
      db.usageLog.create({
        data: {
          organizationId,
          userId: paymentIntent.metadata.userId,
          action: 'credits_purchased',
          resourceId: paymentIntent.id,
          billableCredits: -quantity, // Negative because this adds credits
        },
      }),
    ]);

    console.log(`Successfully processed payment: ${paymentIntent.id}, added ${quantity} credits to org ${organizationId}`);

  } catch (error) {
    console.error('Failed to process successful payment:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const organizationId = paymentIntent.metadata.organizationId;

  if (!organizationId) {
    console.error('Missing organizationId in failed payment intent:', paymentIntent.id);
    return;
  }

  try {
    // Create failed transaction record
    await db.transaction.create({
      data: {
        organizationId,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: 'failed',
        roomsPurchased: parseInt(paymentIntent.metadata.quantity || '0'),
        description: 'Failed payment attempt',
      },
    });

    console.log(`Recorded failed payment: ${paymentIntent.id}`);

  } catch (error) {
    console.error('Failed to record failed payment:', error);
  }
}
```

### 6.3 Payment Components & UI
- [ ] Build credit purchase interface
- [ ] Create Stripe Elements integration
- [ ] Add payment success/failure handling
- [ ] Implement billing history display

**Create `components/payments/credit-purchase.tsx`:**
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Check } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CreditPurchaseProps {
  currentCredits: number;
  onPurchaseComplete?: () => void;
}

const PRESET_QUANTITIES = [
  { quantity: 10, popular: false },
  { quantity: 25, popular: false },
  { quantity: 50, popular: true },
  { quantity: 100, popular: false },
];

export function CreditPurchase({ currentCredits, onPurchaseComplete }: CreditPurchaseProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(50);
  const [customQuantity, setCustomQuantity] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const { toast } = useToast();

  const quantity = customQuantity ? parseInt(customQuantity) || 0 : selectedQuantity;

  const createPaymentIntent = async () => {
    if (quantity < 1) {
      toast({
        title: "Invalid Quantity",
        description: "Please select at least 1 credit to purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPricing(data);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (!clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Staging Credits
          </CardTitle>
          <CardDescription>
            You currently have {currentCredits} credits remaining
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Quantities */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Choose a package
            </Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PRESET_QUANTITIES.map((preset) => {
                const price = preset.quantity * (
                  preset.quantity >= 100 ? 349 :
                  preset.quantity >= 50 ? 399 :
                  preset.quantity >= 10 ? 449 : 499
                );
                const pricePerRoom = price / preset.quantity;
                
                return (
                  <Card 
                    key={preset.quantity}
                    className={`cursor-pointer transition-all ${
                      selectedQuantity === preset.quantity && !customQuantity
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedQuantity(preset.quantity);
                      setCustomQuantity("");
                    }}
                  >
                    <CardContent className="p-4 text-center relative">
                      {preset.popular && (
                        <Badge className="absolute -top-2 -right-2" variant="default">
                          Popular
                        </Badge>
                      )}
                      <div className="text-2xl font-bold">{preset.quantity}</div>
                      <div className="text-sm text-muted-foreground">credits</div>
                      <div className="text-lg font-semibold mt-2">
                        {formatPrice(price)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(pricePerRoom)} per room
                      </div>
                      {preset.quantity >= 10 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          {Math.round((1 - pricePerRoom / 499) * 100)}% off
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Quantity */}
          <div className="space-y-2">
            <Label htmlFor="custom-quantity">Or enter custom amount</Label>
            <Input
              id="custom-quantity"
              type="number"
              placeholder="Enter number of credits"
              min="1"
              max="1000"
              value={customQuantity}
              onChange={(e) => {
                setCustomQuantity(e.target.value);
                if (e.target.value) setSelectedQuantity(0);
              }}
            />
          </div>

          {/* Pricing Summary */}
          {quantity > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span>Quantity:</span>
                  <span className="font-medium">{quantity} credits</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Price per room:</span>
                  <span className="font-medium">
                    {formatPrice(quantity >= 100 ? 349 : quantity >= 50 ? 399 : quantity >= 10 ? 449 : 499)}
                  </span>
                </div>
                {quantity >= 10 && (
                  <div className="flex justify-between items-center mb-2 text-green-600">
                    <span>Bulk discount:</span>
                    <span className="font-medium">
                      {Math.round((1 - (quantity >= 100 ? 349 : quantity >= 50 ? 399 : 449) / 499) * 100)}% off
                    </span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    {formatPrice(quantity * (quantity >= 100 ? 349 : quantity >= 50 ? 399 : quantity >= 10 ? 449 : 499))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={createPaymentIntent} 
            className="w-full" 
            disabled={quantity < 1 || isLoading}
          >
            {isLoading ? "Setting up..." : `Purchase ${quantity} Credit${quantity !== 1 ? 's' : ''}`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm 
        pricing={pricing} 
        onSuccess={() => {
          setClientSecret("");
          setPricing(null);
          onPurchaseComplete?.();
        }} 
      />
    </Elements>
  );
}

function CheckoutForm({ pricing, onSuccess }: { pricing: any; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong with your payment.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful!",
        description: `Successfully purchased ${pricing.quantity} staging credits.`,
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>
          {pricing.quantity} staging credits for {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(pricing.amount / 100)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(pricing.amount / 100)}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Create `app/dashboard/billing/page.tsx`:**
```typescript
import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditPurchase } from "@/components/payments/credit-purchase";
import { formatCurrency } from "@/lib/stripe";

export default async function BillingPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  // Get recent transactions
  const transactions = await db.transaction.findMany({
    where: {
      organizationId: userWithOrg.organization.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your staging credits and billing history
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Credits */}
        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
            <CardDescription>Available staging credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userWithOrg.organization.creditsRemaining}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                credits
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Each credit can stage one room
            </p>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Current subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {userWithOrg.organization.planType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Pay-per-use pricing • No monthly fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Credits */}
      <CreditPurchase 
        currentCredits={userWithOrg.organization.creditsRemaining}
        onPurchaseComplete={() => {
          // Refresh the page to show updated credits
          window.location.reload();
        }}
      />

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.amountCents)}
                    </p>
                    <Badge 
                      variant={
                        transaction.status === 'succeeded' ? 'default' : 
                        transaction.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Verification Steps:**
- [ ] Stripe configuration loads correctly
- [ ] Payment intents create successfully
- [ ] Webhooks process payments properly
- [ ] Credits are added to organizations
- [ ] Payment UI renders and functions
- [ ] Transaction history displays correctly
- [ ] Bulk pricing discounts apply properly

---

## Phase 7: Final Integration & Testing

### 7.1 End-to-End Workflow Integration
- [ ] Connect all components into complete user flow
- [ ] Add comprehensive error handling
- [ ] Implement loading states throughout
- [ ] Create success confirmation flows

**Create `app/dashboard/projects/[id]/page.tsx`:**
```typescript
import { getCurrentUserWithOrg } from "@/lib/auth-utils";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/upload/image-upload";
import { StagingForm } from "@/components/staging/staging-form";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Eye } from "lucide-react";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user || !userWithOrg.organization) {
    redirect("/sign-in");
  }

  const project = await db.project.findFirst({
    where: {
      id: params.id,
      organizationId: userWithOrg.organization.id,
    },
    include: {
      roomImages: {
        include: {
          stagingJobs: {
            include: {
              stagedImages: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.address && (
            <p className="text-muted-foreground">{project.address}</p>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{project.roomImages.length}</div>
            <p className="text-sm text-muted-foreground">Room Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {project.roomImages.reduce((acc, img) => 
                acc + img.stagingJobs.filter(job => job.status === 'completed').length, 0
              )}
            </div>
            <p className="text-sm text-muted-foreground">Staged Rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              <Badge variant="secondary">{project.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms">Room Images</TabsTrigger>
          <TabsTrigger value="staging">Staging</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Room Images</CardTitle>
              <CardDescription>
                Upload photos of empty rooms to be staged with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload 
                projectId={project.id}
                onUploadComplete={() => {
                  // Refresh the page to show new images
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>

          {project.roomImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Images</CardTitle>
                <CardDescription>
                  Manage your room images and start staging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {project.roomImages.map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="relative aspect-video">
                        <Image
                          src={image.s3Url}
                          alt={image.filename}
                          fill
                          className="object-cover"
                        />
                        {image.roomType && (
                          <Badge 
                            variant="secondary" 
                            className="absolute top-2 left-2"
                          >
                            {image.roomType.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm mb-2">{image.filename}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          {image.stagingJobs.length === 0 ? (
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                // Switch to staging tab and focus on this image
                                const event = new CustomEvent('focusStaging', { 
                                  detail: { imageId: image.id } 
                                });
                                window.dispatchEvent(event);
                                document.querySelector('[data-value="staging"]')?.click();
                              }}
                            >
                              Stage
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" className="flex-1">
                              Staged
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="staging" className="space-y-6">
          {project.roomImages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Upload room images first to start staging
                </p>
                <Button onClick={() => document.querySelector('[data-value="rooms"]')?.click()}>
                  Go to Upload
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {project.roomImages.map((image) => (
                <Card key={image.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{image.filename}</CardTitle>
                    <div className="relative aspect-video rounded-md overflow-hidden">
                      <Image
                        src={image.s3Url}
                        alt={image.filename}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {image.stagingJobs.length === 0 ? (
                      <StagingForm 
                        roomImageId={image.id}
                        onStagingComplete={() => {
                          // Refresh to show results
                          window.location.reload();
                        }}
                      />
                    ) : (
                      <div className="space-y-2">
                        {image.stagingJobs.map((job) => (
                          <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">
                                Staging Job
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'default' :
                                job.status === 'processing' ? 'secondary' :
                                job.status === 'failed' ? 'destructive' :
                                'outline'
                              }
                            >
                              {job.status}
                            </Badge>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // Allow creating another staging job
                            // This could open a modal or expand an inline form
                          }}
                        >
                          Create Another Staging
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {project.roomImages.some(img => 
            img.stagingJobs.some(job => job.stagedImages.length > 0)
          ) ? (
            <div className="grid gap-6">
              {project.roomImages.map((image) =>
                image.stagingJobs.map((job) =>
                  job.stagedImages.map((stagedImage) => (
                    <Card key={stagedImage.id}>
                      <CardHeader>
                        <CardTitle>Staged: {image.filename}</CardTitle>
                        <CardDescription>
                          Created {new Date(stagedImage.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Original Image */}
                          <div>
                            <h4 className="font-medium mb-2">Original</h4>
                            <div className="relative aspect-video rounded-md overflow-hidden">
                              <Image
                                src={image.s3Url}
                                alt="Original room"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>

                          {/* Staged Image */}
                          <div>
                            <h4 className="font-medium mb-2">AI Staged</h4>
                            <div className="relative aspect-video rounded-md overflow-hidden">
                              <Image
                                src={stagedImage.s3Url}
                                alt="Staged room"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download Original
                          </Button>
                          <Button className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download Staged
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No staged images yet. Complete some staging jobs to see results here.
                </p>
                <Button onClick={() => document.querySelector('[data-value="staging"]')?.click()}>
                  Start Staging
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 7.2 Testing & Quality Assurance
- [ ] Create comprehensive test scenarios
- [ ] Test all user workflows end-to-end
- [ ] Verify error handling and edge cases
- [ ] Check responsive design across devices

**Create `__tests__/integration.test.ts`:**
```typescript
// Integration test examples (implement with your preferred testing framework)

describe('Magic Staging Integration Tests', () => {
  describe('Authentication Flow', () => {
    test('should allow user to sign up with email', async () => {
      // Test email signup
    });

    test('should allow user to sign in with Google', async () => {
      // Test Google OAuth
    });

    test('should redirect unauthenticated users', async () => {
      // Test auth middleware
    });
  });

  describe('Project Management', () => {
    test('should create new project successfully', async () => {
      // Test project creation
    });

    test('should upload images to project', async () => {
      // Test image upload flow
    });
  });

  describe('AI Staging', () => {
    test('should create staging job', async () => {
      // Test staging job creation
    });

    test('should process staging with AI', async () => {
      // Test AI processing (mock Gemini API)
    });
  });

  describe('Payment Processing', () => {
    test('should create payment intent', async () => {
      // Test payment intent creation
    });

    test('should handle successful payment webhook', async () => {
      // Test webhook processing
    });
  });
});
```

**Create `scripts/test-workflow.ts`:**
```typescript
// Manual testing checklist script
const testWorkflow = [
  {
    step: 1,
    name: "User Registration & Authentication",
    tasks: [
      "✓ Sign up with email and password",
      "✓ Sign in with Google OAuth",
      "✓ Access dashboard after authentication",
      "✓ Logout functionality works",
    ]
  },
  {
    step: 2,
    name: "Project Creation & Management",
    tasks: [
      "✓ Create new project with name and address",
      "✓ View projects list",
      "✓ Access individual project details",
      "✓ Edit project information",
    ]
  },
  {
    step: 3,
    name: "Image Upload System",
    tasks: [
      "✓ Drag and drop images successfully",
      "✓ Upload progress tracking works",
      "✓ Images appear in project after upload",
      "✓ Error handling for invalid files",
    ]
  },
  {
    step: 4,
    name: "AI Virtual Staging",
    tasks: [
      "✓ Create staging job with custom prompt",
      "✓ Select different styling options",
      "✓ Processing completes successfully",
      "✓ Staged image appears in results",
    ]
  },
  {
    step: 5,
    name: "Payment & Billing",
    tasks: [
      "✓ View current credit balance",
      "✓ Purchase credits with Stripe",
      "✓ Credits added after successful payment",
      "✓ Transaction appears in billing history",
    ]
  },
  {
    step: 6,
    name: "Complete User Journey",
    tasks: [
      "✓ Sign up → Create project → Upload images → Purchase credits → Stage rooms → View results",
      "✓ All components work together smoothly",
      "✓ Error states handle gracefully",
      "✓ Loading states provide feedback",
    ]
  }
];

export default testWorkflow;
```

### 7.3 Performance Optimization
- [ ] Implement image optimization and caching
- [ ] Add database query optimization
- [ ] Set up proper loading states
- [ ] Configure caching strategies

**Create `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    ppr: true, // Partial Prerendering
  },
  async rewrites() {
    return [
      {
        source: '/api/webhooks/stripe',
        destination: '/api/webhooks/stripe',
      },
    ];
  },
};

module.exports = nextConfig;
```

**Create `lib/cache.ts`:**
```typescript
// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.timestamp + cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCached<T>(key: string, data: T, ttlMs: number = 300000): void { // 5min default
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

export function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
```

### 7.4 Deployment Preparation
- [ ] Configure environment variables for production
- [ ] Set up monitoring and error tracking
- [ ] Prepare database for production deployment
- [ ] Configure domain and SSL certificates

**Create `deploy.md`:**
```markdown
# Magic Staging Deployment Guide

## Pre-Deployment Checklist

### Environment Setup
- [ ] Production database configured (Supabase/PostgreSQL)
- [ ] AWS S3 bucket created with proper permissions
- [ ] Stripe account configured with webhooks
- [ ] Google Cloud Console project set up for Gemini API
- [ ] Domain purchased and DNS configured

### Environment Variables
- [ ] All production environment variables set in Vercel
- [ ] Database URLs updated for production
- [ ] API keys secured and validated
- [ ] CORS origins configured properly

### Security Configuration
- [ ] Stripe webhook endpoints configured
- [ ] AWS IAM permissions minimized
- [ ] Authentication providers configured for production domain
- [ ] Rate limiting enabled

### Performance
- [ ] Database indexes created
- [ ] Image optimization configured
- [ ] CDN setup for static assets
- [ ] Caching strategies implemented

## Deployment Steps

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Post-Deployment Testing**
   - [ ] Authentication flows
   - [ ] Image upload functionality
   - [ ] AI staging process
   - [ ] Payment processing
   - [ ] Webhook endpoints

4. **Monitoring Setup**
   - [ ] Sentry error tracking configured
   - [ ] PostHog analytics active
   - [ ] Vercel monitoring enabled
   - [ ] Database performance monitoring

## Production URLs
- App: https://magicstaging.com
- API: https://magicstaging.com/api
- Admin: https://magicstaging.com/admin
```

**Final Verification Checklist:**
- [ ] Complete user signup and project creation flow works
- [ ] Image upload to AWS S3 functions properly
- [ ] AI staging with Gemini API processes successfully
- [ ] Stripe payments and webhook processing works
- [ ] All UI components render correctly on mobile and desktop
- [ ] Database queries are optimized and performant
- [ ] Error handling provides useful feedback to users
- [ ] Loading states keep users informed of progress
- [ ] Security measures are properly implemented
- [ ] Production deployment is ready and tested

---

## Summary

This comprehensive development guide provides everything needed to build Magic Staging from foundation to production deployment. Each phase builds methodically on the previous, ensuring a robust, scalable, and profitable SaaS application.

**Key Success Metrics:**
- Complete user workflow from signup to staged room download
- Sub-60 second AI processing time
- >95% payment success rate
- <3 second page load times
- Mobile-responsive design
- Production-ready security and performance

Follow each checkbox systematically, and you'll have a market-ready virtual staging platform that can generate significant revenue in the real estate market.