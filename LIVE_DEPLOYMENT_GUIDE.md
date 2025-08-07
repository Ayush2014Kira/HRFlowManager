# Live Vercel Deployment Guide

## Quick Start (3 Steps)

### Step 1: Get Your Database
Choose one of these free database providers:

**Option A: Neon (Recommended)**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new database
4. Copy the connection string (looks like: `postgresql://username:password@host/database`)

**Option B: Supabase**  
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string

### Step 2: Deploy to Vercel

**Method 1: GitHub Integration (Recommended)**
1. Push your code to GitHub repository
2. Go to https://vercel.com
3. Import your GitHub repository
4. Vercel will automatically detect the project

**Method 2: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Set Environment Variables

In your Vercel project dashboard, add these environment variables:

**Required Variables:**
```
DATABASE_URL = your-database-connection-string
SESSION_SECRET = any-secure-random-string-32-characters-or-more
NODE_ENV = production
```

**Optional Variables (for advanced features):**
```
OPENAI_API_KEY = sk-your-openai-key-for-ai-features
SENDGRID_API_KEY = SG-your-sendgrid-key-for-emails
```

## Detailed Setup

### Getting API Keys (Optional)

**OpenAI API Key** (for AI document generation):
1. Visit https://platform.openai.com
2. Sign up or login
3. Go to API Keys
4. Create new key (starts with `sk-`)
5. Copy the key

**SendGrid API Key** (for email notifications):
1. Visit https://sendgrid.com  
2. Create free account (100 emails/day free)
3. Go to Settings → API Keys
4. Create new key with "Full Access"
5. Copy the key (starts with `SG.`)

### Build Configuration

Your project is already configured with these files:
- `vercel.json` - Deployment configuration
- `package.json` - Build scripts  
- `.env.example` - Environment variables template

The build process will:
1. Install dependencies
2. Build the React frontend
3. Build the Node.js backend
4. Deploy both as serverless functions

### Database Setup

After deployment, the database tables will be created automatically when you first access the application.

**Default Login:**
- Username: `admin`
- Password: `admin123`

### Vercel Configuration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*", 
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ]
}
```

## Testing Your Deployment

### 1. Access Your Application
Your app will be available at: `https://your-project-name.vercel.app`

### 2. Test Login
Use credentials: `admin` / `admin123`

### 3. Test Core Features
- Employee management
- Attendance tracking  
- Leave applications
- Dashboard analytics

### 4. Test Advanced Features (if API keys provided)
- AI document generation
- Email notifications
- eSSL device integration
- GPS field work tracking

## Troubleshooting

### Build Errors
**Error: "Cannot find module"**
- Solution: Check all dependencies in package.json
- Run: `npm install` locally to verify

**Error: "Database connection failed"**
- Solution: Verify DATABASE_URL format
- Check database is accessible from Vercel

### Runtime Errors  
**Error: "Session secret required"**
- Solution: Add SESSION_SECRET environment variable

**Error: "OpenAI API key not found"**
- Solution: Add OPENAI_API_KEY or ignore (AI features optional)

### Performance Issues
**Slow loading**
- Vercel functions have cold start delay
- Database connection pooling helps
- Enable caching in production

## Environment Variables Reference

Copy this template to Vercel dashboard:

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
SESSION_SECRET=your-secure-secret-key-here-minimum-32-chars
NODE_ENV=production

# Optional (enables advanced features)
OPENAI_API_KEY=sk-your-openai-key-here
SENDGRID_API_KEY=SG.your-sendgrid-key-here
```

## Post-Deployment Checklist

- [ ] Database connected successfully
- [ ] Login working with admin/admin123  
- [ ] Employee management functional
- [ ] Attendance tracking working
- [ ] Leave applications processing
- [ ] Dashboard displaying data
- [ ] API endpoints responding
- [ ] Mobile API accessible (if needed)
- [ ] AI features working (if API key provided)
- [ ] Email notifications working (if API key provided)

## Features Available

### Core HRMS Features
- Multi-company employee management
- Real-time attendance tracking with punch-in/out
- Leave application and approval workflow  
- Payroll calculations and management
- Department and role-based access control
- Comprehensive dashboard and reporting
- Miss-punch request system
- Multi-user authentication

### Enterprise Features (with API keys)
- AI-powered document generation (policies, contracts, reports)
- Email notifications for approvals and alerts
- eSSL biometric device integration
- GPS tracking for field work
- Advanced reporting and analytics
- Mobile application support
- Real-time synchronization

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify all environment variables
3. Test database connectivity
4. Review API endpoint responses

Your HRMS is now production-ready and scalable for enterprise use!