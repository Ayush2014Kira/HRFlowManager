# Simple HRMS Setup Guide - Local Development Only

A clean, simple Human Resource Management System for local development without complex integrations.

## What's Included
- ✅ Employee Management
- ✅ Attendance Tracking (Manual Punch In/Out)
- ✅ Leave Management & Approvals
- ✅ Basic Payroll Processing
- ✅ Dashboard & Reports
- ✅ User Authentication
- ✅ Department Management

## What's NOT Included
- ❌ Vercel/Cloud deployment configurations
- ❌ eSSL Biometric device integration
- ❌ AI document generation (OpenAI)
- ❌ Email notifications (SendGrid)
- ❌ GPS tracking features
- ❌ Complex production setups

## Prerequisites
1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/)
3. **Git**: Download from [git-scm.com](https://git-scm.com/)

## Local Setup

### Step 1: Database Setup
1. **Install and start PostgreSQL**
2. **Create database**:
```sql
-- Connect to PostgreSQL
CREATE DATABASE hrms_simple;
CREATE USER hrms_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE hrms_simple TO hrms_user;
```

### Step 2: Project Setup
1. **Create project folder and copy files**:
```bash
mkdir hrms-simple
cd hrms-simple
# Copy all project files here
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create .env file**:
```env
# Database Configuration
DATABASE_URL="postgresql://hrms_user:password123@localhost:5432/hrms_simple"

# Session Security
SESSION_SECRET="your-simple-secret-key-change-this"

# Development Environment
NODE_ENV="development"
PORT=5000
```

4. **Initialize database**:
```bash
npm run db:push
```

5. **Start the application**:
```bash
npm run dev
```

6. **Access the application**:
   - URL: http://localhost:5000
   - Login: admin / admin123

## Project Structure
```
hrms-simple/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/      # Application pages
│   │   └── lib/        # Utilities
├── server/              # Express backend
│   ├── index.ts        # Main server file
│   ├── routes.ts       # API routes
│   ├── storage.ts      # Database operations
│   └── db.ts          # Database connection
├── shared/              # Shared types
│   └── schema.ts       # Database schema
├── package.json        # Dependencies
└── .env               # Environment variables
```

## Available Features

### 1. Employee Management
- Add/edit/view employees
- Department assignment
- Employee profiles

### 2. Attendance System
- Manual punch in/out
- View attendance records
- Daily attendance summary

### 3. Leave Management
- Submit leave applications
- Leave approval workflow
- Leave balance tracking

### 4. Basic Payroll
- Salary calculations
- Payroll records
- Basic reports

### 5. Dashboard
- Employee statistics
- Attendance overview
- Quick actions

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Database schema push
npm run db:push

# Install new packages
npm install package-name
```

## GitHub Setup (Optional)

### 1. Initialize Git
```bash
git init
git add .
git commit -m "Initial commit: Simple HRMS system"
```

### 2. Create GitHub Repository
1. Go to [github.com](https://github.com) and create new repository
2. Name it: `simple-hrms`
3. Don't initialize with README

### 3. Push to GitHub
```bash
# Add GitHub remote (replace with your URL)
git remote add origin https://github.com/yourusername/simple-hrms.git
git branch -M main
git push -u origin main
```

### 4. .gitignore File
```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.local

# Build output
dist/
build/

# IDE
.vscode/

# OS
.DS_Store

# Logs
*.log
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # Mac

# Test connection
psql -h localhost -U hrms_user -d hrms_simple
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Package Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Adding New Features

### Add New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link if needed

### Add New API Endpoint
1. Add route in `server/routes.ts`
2. Add database method in `server/storage.ts`
3. Update schema in `shared/schema.ts` if needed

### Add New Database Table
1. Define schema in `shared/schema.ts`
2. Add CRUD operations in `server/storage.ts`
3. Create API routes in `server/routes.ts`
4. Run `npm run db:push`

## Default Users
- **Admin**: username: `admin`, password: `admin123`

## Support
- Check terminal logs for error messages
- Verify database connection string
- Ensure PostgreSQL service is running
- Check that port 5000 is available

This is a simple, clean HRMS system perfect for learning and small-scale use!