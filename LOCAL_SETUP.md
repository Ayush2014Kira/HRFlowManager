# Local Development Setup

This guide will help you set up the HRMS system on your local computer for development.

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Download from [postgresql.org](https://www.postgresql.org/download/)
3. **Git**: Download from [git-scm.com](https://git-scm.com/)

## Database Setup

1. **Install PostgreSQL** and create a database:
```sql
CREATE DATABASE hrms_db;
CREATE USER hrms_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;
```

2. **Get your database connection string:**
```
postgresql://hrms_user:your_password@localhost:5432/hrms_db
```

## Project Setup

1. **Clone the project** (if from GitHub):
```bash
git clone <your-repo-url>
cd hrms-project
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file** - Copy `.env.local.example` to `.env`:
```bash
cp .env.local.example .env
```

4. **Edit .env file** with your settings:
```env
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://hrms_user:your_password@localhost:5432/hrms_db"

# Session Security (REQUIRED)
SESSION_SECRET="your-super-secret-session-key-change-this"

# Development Mode
NODE_ENV="development"
PORT=5000

# Optional API Keys (for enhanced features)
# OPENAI_API_KEY="sk-your-openai-api-key-here"
# SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
```

5. **Setup database schema:**
```bash
npm run db:push
```

6. **Start development server:**
```bash
npm run dev
```

## Access the Application

- **URL**: http://localhost:5000
- **Admin Login**: admin / admin123

## Features Available Locally

### Core Features (No API keys needed)
- ✅ Employee Management
- ✅ Attendance Tracking
- ✅ Leave Management
- ✅ Payroll Processing
- ✅ Dashboard & Reports

### Enhanced Features (Require API Keys)
- 🔑 **AI Document Generation** (needs OPENAI_API_KEY)
  - Generate HR policies, contracts, job descriptions
  - Get from: https://platform.openai.com/api-keys

- 🔑 **Email Notifications** (needs SENDGRID_API_KEY)
  - Email alerts for leave approvals, salary slips
  - Get from: https://app.sendgrid.com/settings/api_keys

- 🔑 **eSSL Biometric Integration** (needs device configuration)
  - Add to .env: `ESSL_DEVICES='[{"ip":"192.168.1.100","port":4370,"name":"Main Office"}]'`

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U hrms_user -d hrms_db
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Schema Sync Issues
```bash
# Reset database schema
npm run db:push
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run database migrations
npm run db:push

# View database schema
npm run db:studio
```

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend  
├── shared/          # Shared types and schemas
├── .env            # Environment variables (create this)
├── package.json    # Dependencies
└── README.md       # Project documentation
```

## Need Help?

1. Check the logs in your terminal for error messages
2. Verify your database connection string is correct
3. Make sure PostgreSQL service is running
4. Check that all npm dependencies are installed

The system is designed to work without API keys - you can use all core HR features locally!