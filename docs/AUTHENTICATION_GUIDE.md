# Authentication Guide - Better-Auth Deep Dive

## 🔐 Understanding Authentication in Your App

Your app uses **Better-Auth**, a modern authentication library that handles all the complex security stuff so you don't have to worry about it.

## 🏗️ Authentication Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Better-Auth   │    │   Database      │
│   (React)       │◄──►│   (Server)      │◄──►│   (PostgreSQL)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Sign-in forms │    │ • Session mgmt  │    │ • users table   │
│ • useSession()  │    │ • Google OAuth  │    │ • sessions table│
│ • Auth checks   │    │ • Secure tokens │    │ • accounts table│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
    ┌──────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Cookies  │    │   API Routes    │    │ Prisma Schema   │
    │ (Secure) │    │ /api/auth/*     │    │ Auth Models     │
    └──────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 How Authentication Works

### 1. User Sign-In Flow (Google OAuth)

**Step 1**: User clicks "Continue with Google"
```typescript
// components/auth/sign-in-form.tsx
const handleGoogleSignIn = async () => {
  await signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
};
```

**Step 2**: Better-Auth redirects to Google
```
https://accounts.google.com/oauth/v2/auth?
  client_id=your-google-client-id&
  redirect_uri=http://localhost:3000/api/auth/callback/google&
  response_type=code&
  scope=email profile
```

**Step 3**: Google redirects back with auth code
```
http://localhost:3000/api/auth/callback/google?code=4/0AVMBsJh...
```

**Step 4**: Better-Auth exchanges code for user info
```javascript
// Better-Auth automatically:
// 1. Exchanges auth code for access token
// 2. Fetches user profile from Google
// 3. Creates/updates user in database
// 4. Creates secure session
// 5. Sets session cookie
// 6. Redirects to /dashboard
```

**Step 5**: User lands on dashboard (authenticated)

### 2. Session Management

**Session Creation**:
```sql
-- Better-Auth creates a session record
INSERT INTO sessions (id, userId, token, expiresAt) 
VALUES ('sess_123', 'user_456', 'secure_token_789', '2024-01-07');
```

**Session Cookie**:
```http
Set-Cookie: better-auth.session_token=secure_token_789; 
            HttpOnly; 
            Secure; 
            SameSite=Lax;
            Expires=Sun, 07 Jan 2024
```

**Session Validation** (on every request):
```typescript
// lib/auth-utils.ts
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user as User || null;
  } catch {
    return null;
  }
}
```

## 📁 Authentication Files Breakdown

### Core Configuration
**`lib/auth.ts`** - Server-side Better-Auth setup
```typescript
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
});
```

**`lib/auth-client.ts`** - Client-side auth helpers
```typescript
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || window.location.origin,
});

// These functions are available in your components:
export const { signIn, signUp, signOut, useSession } = authClient;
```

**`lib/auth-utils.ts`** - Server-side helper functions
```typescript
// Get current user in server components
export async function getCurrentUser(): Promise<User | null>

// Get user + organization data
export async function getCurrentUserWithOrg()

// Throw error if not authenticated
export async function requireAuth()

// Throw error if not in an organization
export async function requireAuthWithOrg()
```

### API Routes
**`app/api/auth/[...all]/route.ts`** - Handles all auth requests
```typescript
import { auth } from "@/lib/auth";

export const GET = auth.handler;
export const POST = auth.handler;
```

This single route handles:
- `POST /api/auth/sign-in/social` - Start OAuth flow
- `GET /api/auth/callback/google` - Handle OAuth callback
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/sign-out` - Sign out user

### Frontend Components
**`components/auth/sign-in-form.tsx`** - Sign-in UI
```typescript
"use client";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };
  // ... form UI
}
```

**React Hook Usage**:
```typescript
"use client";
import { useSession, signOut } from "@/lib/auth-client";

function UserProfile() {
  const { data: session } = useSession();
  
  if (!session) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <p>Hello {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Database Models

Better-Auth requires these tables in your Prisma schema:

**`User` Model**:
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  emailVerified Boolean  @default(false)
  
  // Relations to auth tables
  sessions      Session[]
  accounts      Account[]
}
```

**`Session` Model**:
```prisma
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**`Account` Model** (for OAuth providers):
```prisma
model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String    // Google user ID
  providerId            String    // "google"
  accessToken           String?   // Google access token
  refreshToken          String?
  idToken               String?   // JWT with user info
  accessTokenExpiresAt  DateTime?
  scope                 String?   // "email profile"
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([providerId, accountId])
}
```

## 🔒 Security Features

### Automatic Security Measures

**Secure Cookies**:
- `HttpOnly`: Can't be accessed via JavaScript
- `Secure`: Only sent over HTTPS in production  
- `SameSite=Lax`: CSRF protection

**Token Security**:
- Cryptographically secure random tokens
- Automatic token rotation
- Secure token storage in database

**Session Management**:
- Automatic session expiration (7 days)
- Session invalidation on sign-out
- Multiple device support

### Route Protection

**Middleware Protection**:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('better-auth.session_token');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }
}
```

**Server Component Protection**:
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg?.user) {
    redirect("/sign-in");  // Redirect if not authenticated
  }
  
  return <div>Welcome {userWithOrg.user.name}!</div>;
}
```

**Client Component Protection**:
```typescript
"use client";
import { useSession } from "@/lib/auth-client";

function ProtectedComponent() {
  const { data: session, isLoading } = useSession();
  
  if (isLoading) return <div>Loading...</div>;
  if (!session) return <div>Please sign in</div>;
  
  return <div>Protected content</div>;
}
```

## 🛠️ Development Tools & Debugging

### Check Authentication Status
```bash
# In browser console (on your app page)
fetch('/api/auth/get-session').then(r => r.json()).then(console.log)
```

### Common Auth Issues & Solutions

**"No session found"**:
```typescript
// Check if cookies are being set
document.cookie.includes('better-auth.session_token')

// Clear all auth cookies and try again
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

**OAuth callback errors**:
```bash
# Check your Google OAuth configuration
echo "Callback URL should be: http://localhost:3000/api/auth/callback/google"

# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

**Database connection issues**:
```bash
# Check if auth tables exist
npx prisma studio
# Look for: users, sessions, accounts, verifications tables
```

### Session Debugging

**Server-side debugging**:
```typescript
// Add to any server component
const session = await auth.api.getSession({
  headers: await headers(),
});
console.log('Current session:', session);
```

**Client-side debugging**:
```typescript
// Add to any client component  
const { data: session, isLoading, error } = useSession();
console.log({ session, isLoading, error });
```

## 🌐 Production Considerations

### Environment Variables
```bash
# Production values
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.com"
BETTER_AUTH_SECRET="your-super-secure-32-char-secret"

# Google OAuth (update redirect URLs in Google Console)
GOOGLE_CLIENT_ID="same-as-local"
GOOGLE_CLIENT_SECRET="same-as-local"
```

### Google OAuth Setup
1. **Google Cloud Console** → APIs & Credentials
2. **Update Authorized Redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`

### Security Checklist
- ✅ Use HTTPS in production
- ✅ Set secure `BETTER_AUTH_SECRET`
- ✅ Validate redirect URLs in Google OAuth
- ✅ Enable CORS protection
- ✅ Set up proper CSP headers

This authentication system handles all the complex security requirements while giving you a simple, powerful API to work with! 🚀