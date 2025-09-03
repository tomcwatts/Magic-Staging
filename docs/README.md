# Magic Staging - Documentation

Welcome to the Magic Staging documentation! This collection of guides will help you understand how all the pieces of your AI virtual staging application work together.

## 📚 Documentation Overview

### 🏗️ [Tech Stack Overview](./TECH_STACK_OVERVIEW.md)
**Start here!** Understand the big picture of how Next.js, PostgreSQL, Supabase, Prisma, Better-Auth, and Docker work together.

- Complete architecture diagram
- How each component fits together
- Data flow examples
- Key concepts explained

### 🗄️ [Database Guide](./DATABASE_GUIDE.md)
Deep dive into your database layer - PostgreSQL, Supabase, and Prisma.

- Database schema explanation
- Prisma ORM usage patterns
- Supabase local vs cloud setup
- Common database operations
- Performance tips and debugging

### 🔐 [Authentication Guide](./AUTHENTICATION_GUIDE.md)  
Everything about user authentication with Better-Auth.

- Google OAuth flow explained
- Session management
- Security features
- Frontend and backend auth patterns
- Debugging authentication issues

### 🏠🚀 [Local vs Production](./LOCAL_VS_PRODUCTION.md)
Understand the differences between your local development and production environments.

- Local development setup details
- Production deployment architecture
- Environment configuration
- Migration strategies
- Common deployment issues

### 🛠️ [Development Workflows](./DEVELOPMENT_WORKFLOWS.md)
Day-to-day development practices and tools.

- Daily startup routine
- Database management tools
- Debugging techniques
- Testing approaches
- Code quality tools

## 🚀 Quick Start

If you're new to the project, follow this order:

1. **[Tech Stack Overview](./TECH_STACK_OVERVIEW.md)** - Get the big picture
2. **[Local vs Production](./LOCAL_VS_PRODUCTION.md)** - Understand your environment
3. **[Development Workflows](./DEVELOPMENT_WORKFLOWS.md)** - Learn daily development practices
4. **[Database Guide](./DATABASE_GUIDE.md)** - Deep dive into data management
5. **[Authentication Guide](./AUTHENTICATION_GUIDE.md)** - Master user authentication

## 🎯 Common Scenarios

### "I want to understand how authentication works"
→ Read [Authentication Guide](./AUTHENTICATION_GUIDE.md)

### "I need to make database changes"  
→ Read [Database Guide](./DATABASE_GUIDE.md) → Prisma sections

### "I'm having deployment issues"
→ Read [Local vs Production](./LOCAL_VS_PRODUCTION.md) → Deployment Process

### "I want to understand the overall architecture"
→ Read [Tech Stack Overview](./TECH_STACK_OVERVIEW.md)

### "I need help with daily development tasks"
→ Read [Development Workflows](./DEVELOPMENT_WORKFLOWS.md)

## 🆘 Troubleshooting Quick Reference

### Database Issues
```bash
supabase status        # Check if database is running
supabase start         # Start local database
npx prisma db push     # Update database schema
npx prisma generate    # Regenerate TypeScript types
```

### Authentication Issues
```bash
# Check authentication status
curl http://localhost:3000/api/auth/get-session

# Clear auth cookies
# In browser: DevTools → Application → Cookies → Delete all
```

### Development Server Issues
```bash
npm run dev            # Start development server
npm run typecheck      # Check TypeScript errors
npm run lint           # Check code quality
```

## 🔗 External Resources

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://www.prisma.io/docs)
- **Better-Auth**: [better-auth.com/docs](https://better-auth.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL**: [postgresql.org/docs](https://www.postgresql.org/docs/)

## 📝 Contributing to Documentation

Found something unclear? Want to add more details? 

1. Update the relevant markdown file
2. Keep explanations beginner-friendly
3. Include code examples
4. Test all commands and code snippets
5. Update this README if you add new guides

---

Happy coding! 🚀 If you have questions not covered in these guides, feel free to ask.