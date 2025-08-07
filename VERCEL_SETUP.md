# Quick Vercel Deployment Setup

## Step 1: Get Your API Keys (Optional but Recommended)

### OpenAI API Key (for AI features)
1. Visit https://platform.openai.com
2. Create account or login
3. Go to API Keys section
4. Create new key (starts with `sk-`)
5. Copy the key

### SendGrid API Key (for email notifications)
1. Visit https://sendgrid.com
2. Sign up for free account
3. Go to Settings → API Keys
4. Create new key with "Full Access"
5. Copy the key (starts with `SG.`)

## Step 2: Database Setup

### Option A: Neon (Recommended)
1. Visit https://neon.tech
2. Create free account
3. Create new database
4. Copy connection string

### Option B: Supabase
1. Visit https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string

## Step 3: Deploy to Vercel

### Method 1: One-Click Deploy
1. Click the deploy button (if available)
2. Connect your GitHub account
3. Set environment variables in Vercel dashboard

### Method 2: Manual Deploy
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel login`
3. Run: `vercel --prod`
4. Set environment variables in dashboard

## Step 4: Environment Variables in Vercel

Go to your Vercel project dashboard and add these variables:

**Required:**
- `DATABASE_URL` = your database connection string
- `SESSION_SECRET` = any secure random string (32+ characters)
- `NODE_ENV` = production

**Optional (for advanced features):**
- `OPENAI_API_KEY` = your OpenAI API key
- `SENDGRID_API_KEY` = your SendGrid API key

## Step 5: Database Setup

After deployment:
1. Go to your deployed URL
2. The database tables will be created automatically
3. Use these test credentials:
   - Username: `admin`
   - Password: `admin123`

## Features Available

**✅ Core Features (No API keys needed):**
- Employee management
- Attendance tracking
- Leave management
- Payroll calculations
- Dashboard and reports

**🔑 Premium Features (Requires API keys):**
- AI document generation (needs OpenAI key)
- Email notifications (needs SendGrid key)
- eSSL biometric integration
- GPS field work tracking

## Troubleshooting

**Build Failed?**
- Check all environment variables are set
- Verify database connection string format

**Can't Login?**
- Try credentials: admin/admin123
- Check database is properly connected

**Missing Features?**
- AI features need OpenAI API key
- Email features need SendGrid API key
- Some features are development-only

## Production Checklist

- ✅ Database connected and accessible
- ✅ Environment variables configured
- ✅ Build successful
- ✅ Login working with admin/admin123
- ✅ Basic features functional
- 🔑 AI features (if OpenAI key provided)
- 🔑 Email notifications (if SendGrid key provided)

**Your HRMS is now live and ready to use!** 🎉