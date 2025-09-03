# Database Guide - Supabase + PostgreSQL + Prisma

## 🗄️ Understanding the Database Stack

Your app uses **three layers** working together:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Next.js App                        │
├─────────────────────────────────────────────────────────────┤
│                     Prisma ORM                             │
│  • Type-safe queries                                       │
│  • Schema management                                       │  
│  • TypeScript integration                                  │
├─────────────────────────────────────────────────────────────┤
│                   Supabase Service                         │
│  • Database hosting                                        │
│  • Connection pooling                                      │
│  • Admin dashboard                                         │
├─────────────────────────────────────────────────────────────┤
│                PostgreSQL Database                         │
│  • Actual data storage                                     │
│  • SQL queries                                            │
│  • ACID transactions                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🐘 PostgreSQL - The Database Engine

### What is PostgreSQL?
PostgreSQL is like a super-powered filing cabinet for your data:
- **Tables**: Like spreadsheet tabs (users, projects, images)
- **Rows**: Individual records (one user, one project)
- **Columns**: Data fields (name, email, created_at)
- **Relationships**: How tables connect to each other

### Your Database Schema
Here's what tables you have and how they connect:

```
Users Table                 Organizations Table
┌─────────────┐            ┌─────────────────┐
│ id          │◄───────────┤ id              │
│ email       │            │ name            │
│ name        │            │ creditsRemaining│
│ image       │            │ planType        │
└─────────────┘            └─────────────────┘
       ▲                            ▲
       │                            │
┌─────────────┐            ┌─────────────────┐
│OrganizationMembe│            │ Projects Table  │
│ userId      │            │ organizationId  │
│ organizationId│            │ name           │
│ role        │            │ address        │
└─────────────┘            │ mlsNumber      │
                           └─────────────────┘
```

### Key Concepts

**Primary Keys**: Unique identifiers
```sql
id: "cm4abc123def456ghi789jkl" -- Each record has a unique ID
```

**Foreign Keys**: References to other tables
```sql
organizationId: "cm4xyz789abc123def456ghi" -- Points to an organization
```

**Indexes**: Make queries faster
```sql
email: "tom@example.com" -- Has an index for quick lookups
```

## 🚀 Supabase - Database-as-a-Service

### What Supabase Provides

**Local Development**:
```bash
supabase start
# Starts PostgreSQL + Admin Dashboard + APIs in Docker
```

**Production Hosting**:
- Managed PostgreSQL database
- Automatic backups
- Connection pooling
- Monitoring and logs

### Supabase vs Raw PostgreSQL

| Feature | Raw PostgreSQL | Supabase |
|---------|---------------|----------|
| **Setup** | Install, configure yourself | One command start |
| **Backups** | Manual setup | Automatic |
| **Scaling** | Manual server management | Automatic |
| **Admin UI** | Need separate tool | Built-in dashboard |
| **Security** | Configure firewall, SSL | Pre-configured |

### Working with Supabase

**Local Dashboard**: 
```bash
supabase dashboard
# Opens http://localhost:54323
```

**SQL Editor**: Write raw SQL queries
```sql
SELECT u.name, o.name as org_name 
FROM users u 
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id;
```

**Table Editor**: Visual interface like a spreadsheet

## 🔧 Prisma - Your Database Toolkit

### What Prisma Does

**Schema Definition**: Describe your database in code
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  
  organizations OrganizationMember[]
}
```

**Type-Safe Queries**: TypeScript knows your data structure
```typescript
// ✅ TypeScript knows this returns a User with email
const user = await prisma.user.findUnique({
  where: { email: "tom@example.com" }
})

// ✅ TypeScript prevents typos
const users = await prisma.user.findMany({
  where: { emai: "..." } // ❌ Error: 'emai' doesn't exist
})
```

**Migration Management**: Track database changes over time

### Prisma Client Usage

**Create Records**:
```typescript
const user = await prisma.user.create({
  data: {
    email: "tom@example.com",
    name: "Tom W"
  }
})
```

**Find Records**:
```typescript
const users = await prisma.user.findMany({
  where: { 
    email: { contains: "@gmail.com" } 
  },
  include: { 
    organizations: true  // Include related data
  }
})
```

**Update Records**:
```typescript
const user = await prisma.user.update({
  where: { id: "123" },
  data: { name: "Tom Watts" }
})
```

**Delete Records**:
```typescript
await prisma.user.delete({
  where: { id: "123" }
})
```

## 🔄 Development Workflow

### 1. Making Schema Changes

**Edit Schema File**:
```prisma
// prisma/schema.prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String?
  phone String? // ← Add new field
}
```

**Push to Database**:
```bash
npx prisma db push
# Updates local database structure
```

**Regenerate Client**:
```bash
npx prisma generate
# Updates TypeScript types
```

### 2. Inspecting Data

**Prisma Studio** (Visual Editor):
```bash
npx prisma studio
# Opens http://localhost:5555
```

**Supabase Dashboard** (SQL Editor):
```bash
supabase dashboard
# Opens http://localhost:54323
```

**Command Line**:
```bash
# Connect to database directly
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# List tables
\dt

# View table structure
\d users

# Query data
SELECT * FROM users LIMIT 5;
```

## 🚨 Common Issues & Solutions

### "Can't reach database server"
```bash
# Check if Supabase is running
supabase status

# Start if not running
supabase start

# Check Docker containers
docker ps
```

### "Model doesn't exist in database"
```bash
# Push your schema changes
npx prisma db push

# Regenerate the client
npx prisma generate
```

### "Prisma Client out of sync"
```bash
# Regenerate after schema changes
npx prisma generate

# Or reset and push fresh
npx prisma db push --force-reset
```

### Connection Issues
```bash
# Check your DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin <<< "SELECT 1"
```

## 📊 Database Performance Tips

### Use Indexes for Frequent Queries
```prisma
model User {
  email String @unique  // ← Automatically indexed
  
  @@index([email])      // ← Explicit index
}
```

### Use Relations Instead of Joins
```typescript
// ✅ Good: Use Prisma relations
const userWithOrg = await prisma.user.findUnique({
  where: { id: "123" },
  include: { organizations: { include: { organization: true } } }
})

// ❌ Avoid: Raw SQL joins (when possible)
const result = await prisma.$queryRaw`
  SELECT * FROM users u JOIN organizations o ...
`
```

### Batch Operations
```typescript
// ✅ Batch create
await prisma.user.createMany({
  data: [
    { email: "user1@example.com" },
    { email: "user2@example.com" }
  ]
})

// ❌ Avoid: Individual creates in loop
for (const userData of users) {
  await prisma.user.create({ data: userData }) // Slow!
}
```

## 🔐 Security Best Practices

### Row Level Security (RLS)
Every table should filter by `organizationId`:
```typescript
// ✅ Always include organizationId
const projects = await prisma.project.findMany({
  where: { 
    organizationId: userOrg.id,  // ← Security filter
    status: "active" 
  }
})
```

### Input Validation
```typescript
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  organizationId: z.string().cuid()
})

// Validate before database operations
const validData = createProjectSchema.parse(inputData)
const project = await prisma.project.create({ data: validData })
```

## 🌐 Production Considerations

### Database Migrations
```bash
# Local: Direct schema push
npx prisma db push

# Production: Use migrations
npx prisma migrate dev --name add_user_phone
npx prisma migrate deploy  # In production
```

### Connection Pooling
Supabase handles this automatically, but be aware:
- **Local**: Direct connection to PostgreSQL
- **Production**: Connection pooling layer

### Backup Strategy
- **Local**: Not needed (disposable)
- **Production**: Supabase provides automatic backups

### Monitoring
Check Supabase dashboard for:
- Query performance
- Connection counts  
- Database size
- Error logs

This setup gives you a powerful, scalable database foundation that grows with your app! 🚀