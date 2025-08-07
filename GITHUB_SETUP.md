# Complete Setup Guide - Local PC & GitHub

This guide helps you set up the HRMS project on your local computer and push it to GitHub.

## Part 1: Local PC Setup

### Prerequisites
1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/)
3. **Git**: Download from [git-scm.com](https://git-scm.com/)
4. **Code Editor**: VS Code recommended

### Step 1: Create Local Directory
```bash
# Create project folder
mkdir hrms-project
cd hrms-project

# Initialize Git (if not cloning)
git init
```

### Step 2: Database Setup
1. **Start PostgreSQL service**:
   - Windows: Start from Services or pgAdmin
   - Mac: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

2. **Create database**:
```sql
-- Connect to PostgreSQL (psql -U postgres)
CREATE DATABASE hrms_local;
CREATE USER hrms_admin WITH PASSWORD 'hrms123456';
GRANT ALL PRIVILEGES ON DATABASE hrms_local TO hrms_admin;
```

3. **Get connection string**:
```
DATABASE_URL="postgresql://hrms_admin:hrms123456@localhost:5432/hrms_local"
```

### Step 3: Project Files Setup
1. **Copy all project files** to your local folder
2. **Install dependencies**:
```bash
npm install
```

3. **Create .env file**:
```bash
# Copy the example file
cp .env.local.example .env
```

4. **Edit .env with your settings**:
```env
# Database (REQUIRED)
DATABASE_URL="postgresql://hrms_admin:hrms123456@localhost:5432/hrms_local"
SESSION_SECRET="your-super-secret-key-change-this-to-something-random"

# Environment
NODE_ENV="development"
PORT=5000

# Optional API Keys (for advanced features)
# Get OpenAI key from: https://platform.openai.com/api-keys
# OPENAI_API_KEY="sk-your-openai-key-here"

# Get SendGrid key from: https://app.sendgrid.com/settings/api_keys
# SENDGRID_API_KEY="SG.your-sendgrid-key-here"

# eSSL Device Integration (for biometric attendance)
# ESSL_DEVICES='[{"ip":"192.168.1.100","port":4370,"name":"Main Office"}]'
```

### Step 4: Initialize Database
```bash
# Push database schema
npm run db:push

# This creates all tables: users, employees, departments, etc.
```

### Step 5: Start Development Server
```bash
# Start the application
npm run dev

# Open in browser: http://localhost:5000
# Login: admin / admin123
```

## Part 2: GitHub Setup & Push

### Step 1: Create GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click "New Repository"
3. Name: `hrms-system` (or your preferred name)
4. Description: `AI-Powered Multi-Company HRMS with Advanced Features`
5. Set to Public or Private
6. Don't initialize with README (we have files already)
7. Click "Create Repository"

### Step 2: Prepare Project for GitHub
1. **Create .gitignore** (if not exists):
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment Variables
.env
.env.local
.env.production

# Database
*.db
*.sqlite

# Build Output
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime
pids/
*.pid
*.seed
*.pid.lock

# Coverage
coverage/
.nyc_output

# Temporary
.tmp/
temp/
```

2. **Create README.md**:
```markdown
# AI-Powered HRMS System

A comprehensive Human Resource Management System with enterprise-level features.

## Features
- ✅ Employee Management & Organization
- ✅ Advanced Attendance Tracking with GPS
- ✅ Leave Management & Approval Workflow
- ✅ Payroll Processing & Salary Slips
- ✅ eSSL Biometric Integration
- ✅ AI Document Generation (OpenAI)
- ✅ Multi-Company Support
- ✅ Mobile API Ready
- ✅ Production Deployment Ready

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Deployment**: Vercel/Railway Ready
- **APIs**: OpenAI GPT-4o, SendGrid

## Quick Start
1. Copy `.env.local.example` to `.env`
2. Add your PostgreSQL database URL
3. Run `npm install`
4. Run `npm run db:push`
5. Run `npm run dev`
6. Open http://localhost:5000
7. Login: admin/admin123

## Documentation
- [Local Setup Guide](LOCAL_SETUP.md)
- [Production Deployment](LIVE_DEPLOYMENT_GUIDE.md)
- [Quick Deploy to Vercel](QUICK_DEPLOY.md)

## License
MIT License
```

### Step 3: Push to GitHub
```bash
# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/hrms-system.git

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Complete HRMS system with enterprise features

Features implemented:
- Multi-company employee management
- Advanced attendance tracking with GPS
- Leave management with approval workflow
- Payroll processing and reports
- eSSL biometric device integration
- AI document generation with OpenAI
- Production-ready deployment configuration
- Mobile API support
- Comprehensive test coverage"

# Push to GitHub
git push -u origin main
```

### Step 4: Verify GitHub Repository
1. Go to your GitHub repository
2. Check all files are uploaded
3. Verify README.md displays correctly
4. Check that .env file is NOT uploaded (should be in .gitignore)

## Part 3: Team Collaboration Setup

### For Team Members
```bash
# Clone the repository
git clone https://github.com/yourusername/hrms-system.git
cd hrms-system

# Install dependencies
npm install

# Create their own .env file
cp .env.local.example .env
# Edit .env with their database settings

# Setup database
npm run db:push

# Start development
npm run dev
```

### Git Workflow for Updates
```bash
# Before starting work
git pull origin main

# After making changes
git add .
git commit -m "Description of changes"
git push origin main

# For features, use branches
git checkout -b feature/new-feature
# Make changes
git commit -m "Add new feature"
git push origin feature/new-feature
# Then create Pull Request on GitHub
```

## Production Deployment

### Option 1: Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Option 2: Railway
1. Connect GitHub repository to Railway
2. Add PostgreSQL service
3. Set environment variables
4. Deploy

### Required Environment Variables for Production:
```env
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-production-secret
OPENAI_API_KEY=your-openai-key (optional)
SENDGRID_API_KEY=your-sendgrid-key (optional)
```

## Features Overview

### Core Features (No API keys needed)
- Employee registration and management
- Department organization
- Attendance tracking with manual punch in/out
- Leave application and approval system
- Basic payroll calculations
- Dashboard with analytics
- User authentication and role management

### Enhanced Features (API keys required)
- **AI Document Generation**: HR policies, contracts, job descriptions
- **Email Notifications**: Leave approvals, salary slips
- **eSSL Integration**: Automatic attendance sync from biometric devices
- **GPS Tracking**: Field employee location tracking

## Support
- Check [LOCAL_SETUP.md](LOCAL_SETUP.md) for local development issues
- Check [LIVE_DEPLOYMENT_GUIDE.md](LIVE_DEPLOYMENT_GUIDE.md) for deployment issues
- Review logs in terminal for error messages

The system is fully functional without API keys - all core HR features work perfectly!