# Magic Staging - Tech Stack Overview

## 🏗️ Architecture Overview

Magic Staging uses a modern full-stack architecture with the following key components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │ ←→ │   (API Routes)  │ ←→ │   (PostgreSQL)  │
│                 │    │                 │    │   via Supabase  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ↑                       ↑                       ↑
    ┌────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Better-Auth│    │     Prisma      │    │     Docker      │
    │ (Sessions) │    │    (ORM)        │    │ (Local Dev DB)  │
    └────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧱 Core Components

### 1. **Next.js 15** - Full-Stack React Framework
- **Frontend**: React components with TypeScript
- **Backend**: API routes for server-side logic
- **Routing**: App Router for modern routing patterns
- **Rendering**: Server-side and client-side rendering

### 2. **PostgreSQL** - Primary Database
- **What it is**: A powerful, open-source relational database
- **Purpose**: Stores all your app data (users, projects, images, etc.)
- **Structure**: Tables with relationships between data

### 3. **Supabase** - Database-as-a-Service
- **What it is**: PostgreSQL database hosting with additional features
- **Local Development**: Runs PostgreSQL in Docker containers
- **Production**: Managed PostgreSQL in the cloud
- **Extras**: Authentication, real-time subscriptions, storage

### 4. **Prisma** - Database ORM (Object-Relational Mapping)
- **What it is**: A type-safe database client for TypeScript
- **Purpose**: Makes database queries easy and safe
- **Schema**: Defines your database structure in code
- **Migrations**: Manages database schema changes

### 5. **Better-Auth** - Authentication System
- **What it is**: Modern authentication library for Next.js
- **Features**: Email/password, Google OAuth, sessions
- **Security**: Handles tokens, cookies, and user sessions
- **Database**: Stores auth data in PostgreSQL via Prisma

### 6. **Docker** - Containerization (Local Development)
- **What it is**: Runs applications in isolated containers
- **Purpose**: Provides consistent PostgreSQL database locally
- **Supabase CLI**: Uses Docker to run local database stack

## 🔄 How They Work Together

### Data Flow Example: User Signs In with Google

1. **User clicks "Continue with Google"**
   ```
   Frontend (React) → Better-Auth → Google OAuth
   ```

2. **Google redirects back with user info**
   ```
   Google → Better-Auth → Prisma → PostgreSQL
   ```

3. **User data is stored and session created**
   ```
   PostgreSQL → Prisma → Better-Auth → Frontend
   ```

4. **User is redirected to dashboard**
   ```
   Better-Auth → Next.js Router → Dashboard Page
   ```

### Database Operations Flow

1. **Your code wants to save a project**
   ```typescript
   const project = await prisma.project.create({
     data: { name: "Living Room", organizationId: "123" }
   })
   ```

2. **Prisma translates to SQL**
   ```sql
   INSERT INTO projects (name, organization_id) VALUES ('Living Room', '123');
   ```

3. **SQL is sent to PostgreSQL**
   ```
   Prisma Client → PostgreSQL (via Supabase)
   ```

4. **Result comes back to your app**
   ```
   PostgreSQL → Prisma → Your Next.js API → Frontend
   ```

## 🏠 Local Development Setup

### What's Running Locally

```bash
# Start the local database stack
supabase start
```

This starts **multiple Docker containers**:
- **PostgreSQL**: Your actual database
- **PostgREST**: Auto-generated API
- **Auth Server**: Supabase Auth (not used - we use Better-Auth)
- **Storage**: File storage service
- **Dashboard**: Web UI to inspect database

### Environment Configuration

Your `.env.local` file tells each service how to connect:

```bash
# Prisma connects to local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Better-Auth runs on your Next.js server
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
```

### Development Workflow

1. **Start Database**: `supabase start` (runs PostgreSQL in Docker)
2. **Update Schema**: Edit `prisma/schema.prisma`
3. **Push Changes**: `npx prisma db push` (updates database structure)
4. **Start App**: `npm run dev` (runs Next.js server)

## 🚀 Production Setup

### Key Differences from Local

| Component | Local | Production |
|-----------|-------|------------|
| **Database** | Docker container | Managed Supabase cloud |
| **URL** | `127.0.0.1:54322` | `db.xyz.supabase.co:5432` |
| **Environment** | `.env.local` | Environment variables |
| **Migrations** | `prisma db push` | `prisma migrate deploy` |
| **Deployment** | `npm run dev` | Deployed to Vercel/similar |

### Production Environment Variables

```bash
# Remote Supabase database
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Production domain
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.com"

# Production OAuth (same Google project, different URLs)
GOOGLE_CLIENT_ID="same-as-local"
GOOGLE_CLIENT_SECRET="same-as-local"
```

## 🛠️ Working with Each Component

### PostgreSQL Database
```bash
# Connect directly to local DB
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# View tables
\dt

# Query data
SELECT * FROM users;
```

### Supabase Dashboard
```bash
# Open local dashboard
supabase dashboard
# Opens http://localhost:54323
```

### Prisma Database Management
```bash
# Visual database editor
npx prisma studio
# Opens http://localhost:5555

# Update database schema
npx prisma db push

# Generate TypeScript client
npx prisma generate
```

### Better-Auth Session Management
```typescript
// Check current user session
import { getCurrentUser } from '@/lib/auth-utils'

const user = await getCurrentUser()
if (user) {
  console.log('Logged in as:', user.email)
}
```

## 🔍 Debugging Tools

### Database Issues
- **Prisma Studio**: Visual interface to inspect data
- **Supabase Dashboard**: SQL editor and table viewer
- **psql**: Command-line database access

### Authentication Issues
- **Network tab**: Check API calls to `/api/auth/*`
- **Better-Auth logs**: Server console shows auth errors
- **Session cookies**: Check browser dev tools

### API Issues
- **Next.js dev server**: Shows API route logs
- **Prisma logs**: Enable with `DEBUG="prisma:*"`
- **Network requests**: Browser dev tools

## 📝 Key Files to Know

```
prisma/
├── schema.prisma          # Database structure definition

lib/
├── auth.ts               # Better-Auth configuration  
├── auth-client.ts        # Client-side auth helpers
├── auth-utils.ts         # Server-side auth helpers
├── db.ts                 # Prisma client instance

app/
├── api/auth/[...all]/    # Better-Auth API routes
└── dashboard/            # Protected dashboard pages

.env.local                # Local environment variables
.env                      # Shared environment variables
supabase/config.toml      # Supabase local configuration
```

This architecture gives you:
- ✅ **Type Safety**: TypeScript + Prisma ensures your data operations are safe
- ✅ **Developer Experience**: Local database matches production exactly
- ✅ **Scalability**: PostgreSQL handles high-traffic production loads
- ✅ **Security**: Better-Auth handles complex authentication flows
- ✅ **Flexibility**: Each component can be swapped or upgraded independently