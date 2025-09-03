# Development Workflows & Tools Guide

## 🛠️ Essential Development Tools

Your development environment includes several powerful tools that work together seamlessly. Here's how to use each one effectively.

## 🚀 Daily Development Workflow

### Morning Startup Routine
```bash
# 1. Start your database
supabase start
# ✅ Starts PostgreSQL + Admin UI in Docker

# 2. Start your app  
npm run dev
# ✅ Starts Next.js on http://localhost:3000

# 3. Optional: Open database tools
npx prisma studio          # Visual DB editor
supabase dashboard          # SQL query interface
```

### Making Code Changes

**1. Frontend Changes** (auto-reload):
```bash
# Edit any React component
vim components/dashboard/page.tsx

# Save file → Browser automatically refreshes
# No restart needed!
```

**2. Backend Changes** (auto-reload):
```bash
# Edit API routes
vim app/api/projects/route.ts

# Save file → API automatically reloads
# Test immediately at http://localhost:3000/api/projects
```

**3. Database Schema Changes**:
```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Push to database
npx prisma db push
# ✅ Updates database structure

# 3. Regenerate TypeScript types
npx prisma generate  
# ✅ Updates your code completion
```

## 🗄️ Database Management Tools

### Prisma Studio - Visual Database Editor
```bash
npx prisma studio
# Opens http://localhost:5555
```

**What you can do**:
- ✅ View all tables and data
- ✅ Edit records visually (like Excel)
- ✅ Create new records with forms
- ✅ Delete records with confirmation
- ✅ See relationships between tables

**Best for**:
- Quick data inspection
- Testing database changes
- Adding test data
- Debugging data issues

### Supabase Dashboard - SQL Interface  
```bash
supabase dashboard
# Opens http://localhost:54323
```

**What you can do**:
- ✅ Write raw SQL queries
- ✅ View table structures
- ✅ See query performance
- ✅ Manage database settings
- ✅ View API documentation

**Best for**:
- Complex queries
- Performance analysis
- Learning SQL
- Database administration

### Command Line Database Access
```bash
# Connect directly to PostgreSQL
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Useful commands:
\dt                    # List all tables
\d users              # Describe 'users' table structure  
\q                    # Quit

# Sample queries:
SELECT * FROM users LIMIT 5;
SELECT count(*) FROM projects;
```

**Best for**:
- Quick queries
- Scripting
- Advanced PostgreSQL features
- Troubleshooting connection issues

## 🔧 Code Quality Tools

### TypeScript Checking
```bash
# Check for type errors
npm run typecheck

# Watch for errors (continuous)
npx tsc --watch
```

**What it catches**:
- ✅ Type mismatches
- ✅ Missing properties  
- ✅ Incorrect function calls
- ✅ Database schema violations (via Prisma)

### ESLint (Code Quality)
```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**What it catches**:
- ✅ Code style inconsistencies
- ✅ Potential bugs
- ✅ React best practices
- ✅ Unused variables

### Formatting (Prettier)
```bash
# Format all code
npx prettier --write .

# Check formatting
npx prettier --check .
```

## 🧪 Testing Your Changes

### Manual Testing Checklist

**Authentication Flow**:
```bash
# Test locally:
1. Go to http://localhost:3000
2. Click "Continue with Google"  
3. Complete OAuth flow
4. Verify redirect to /dashboard
5. Check user data in Prisma Studio
```

**Database Operations**:
```bash
# Test CRUD operations:
1. Create new project in UI
2. Check data appears in Prisma Studio
3. Edit project details
4. Verify changes saved
5. Delete project  
6. Confirm removal from database
```

**API Endpoints**:
```bash
# Test with curl:
curl http://localhost:3000/api/auth/get-session

# Or use browser dev tools:
# Network tab → See all API requests
# Console → Check for errors
```

### Debugging Tools

**Browser DevTools**:
```javascript
// In browser console:
// Check authentication status
fetch('/api/auth/get-session').then(r => r.json()).then(console.log)

// Inspect cookies
document.cookie

// Check local storage
localStorage
```

**Server Logs**:
```bash
# Watch server logs in real-time
npm run dev

# Look for:
# ✅ API request logs
# ✅ Database connection status  
# ✅ Authentication events
# ❌ Error messages and stack traces
```

**Database Query Logs**:
```bash
# Enable Prisma query logging
# Add to your code:
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

# See all SQL queries in terminal
```

## 🔄 Working with Different Environments

### Switching Between Local and Remote Database

**Use Local Database**:
```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Restart server to pick up changes
npm run dev
```

**Use Remote Database**:
```bash
# .env.local  
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Push your schema to remote
npx prisma db push

# Restart server
npm run dev
```

### Environment Variable Management

**Check Current Environment**:
```bash
# See what DATABASE_URL is being used
node -e "console.log(process.env.DATABASE_URL)"

# Check all env vars
node -e "console.log(process.env)" | grep DATABASE
```

**Environment Priority**:
```bash
# Highest to lowest priority:
1. .env.local          # Your personal overrides
2. .env.development     # Development defaults
3. .env                # Global defaults
4. System environment  # OS environment variables
```

## 📊 Monitoring and Debugging

### Performance Monitoring

**Database Performance**:
```sql
-- In Supabase dashboard, run:
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;
```

**API Response Times**:
```bash
# In browser DevTools → Network tab
# Look for slow API calls (>1000ms)
# Check for 500 errors
```

**Memory Usage**:
```bash
# Check Docker container usage
docker stats

# Check Node.js memory
# Add to your code:
console.log('Memory usage:', process.memoryUsage());
```

### Error Tracking

**Server Errors**:
```bash
# Watch terminal for errors
npm run dev

# Look for:
# ❌ Unhandled promise rejections
# ❌ Database connection errors
# ❌ Authentication failures
```

**Client Errors**:
```javascript
// In browser console
// Check for React errors, network failures, etc.
```

**Database Errors**:
```bash
# Check Supabase logs
supabase logs db

# Common issues:
# ❌ Connection timeouts
# ❌ Schema mismatch errors
# ❌ Migration conflicts
```

## 🚀 Deployment Workflow

### Pre-deployment Checklist
```bash
# 1. Run all checks
npm run typecheck      # No TypeScript errors
npm run lint          # Code style passes
npm run build         # Production build works

# 2. Test critical flows
# - Authentication works
# - Database operations succeed  
# - API endpoints respond correctly

# 3. Check environment variables
# - Production DATABASE_URL set
# - All secrets configured
# - OAuth redirects updated
```

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/add-projects

# 2. Make changes and commit
git add .
git commit -m "feat: Add project creation functionality"

# 3. Push and create PR
git push origin feature/add-projects

# 4. Deploy after merge
git checkout main
git pull origin main
# Deploy automatically via Vercel/similar
```

## 🛡️ Security Best Practices

### Local Development Security
```bash
# ✅ Never commit .env.local
echo ".env.local" >> .gitignore

# ✅ Use different secrets for local vs production
BETTER_AUTH_SECRET="local-development-secret-32chars"

# ✅ Keep dependencies updated
npm audit
npm update
```

### Database Security
```bash
# ✅ Always include organizationId in queries
const projects = await prisma.project.findMany({
  where: { 
    organizationId: user.organizationId  // 🔒 Security filter
  }
});

# ❌ Never expose raw user data  
// Don't do this:
const allUsers = await prisma.user.findMany(); // Dangerous!
```

### API Security
```bash
# ✅ Validate all inputs
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional()
});

# ✅ Check authentication on protected routes
const user = await requireAuthWithOrg();
```

## 📚 Learning Resources

### When You're Stuck

**Documentation**:
- [Next.js Docs](https://nextjs.org/docs) - App Router, API routes
- [Prisma Docs](https://www.prisma.io/docs) - Database operations
- [Better-Auth Docs](https://better-auth.com/docs) - Authentication
- [Supabase Docs](https://supabase.com/docs) - Database management

**Debugging Approach**:
1. **Check the terminal** - Server errors show here first
2. **Check browser console** - Client-side errors and network requests
3. **Check database** - Use Prisma Studio to verify data
4. **Check environment** - Ensure all env vars are correct

**Common Solutions**:
```bash
# Database connection issues
supabase status
supabase start

# Prisma/TypeScript issues  
npx prisma generate
npm run typecheck

# Authentication issues
# Check cookies in browser DevTools
# Verify Google OAuth settings
```

This workflow keeps you productive and your codebase healthy! 🚀