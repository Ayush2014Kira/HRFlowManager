# Simple HRMS - Human Resource Management System

A clean and simple web-based HR management system built with modern technologies.

## Features
- Employee Management
- Attendance Tracking (Manual Punch In/Out)  
- Leave Management & Approvals
- Basic Payroll Processing
- Dashboard with Reports
- User Authentication & Roles
- Department Management

## Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **UI Components**: Shadcn/ui

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### 2. Database Setup
```sql
CREATE DATABASE hrms_simple;
CREATE USER hrms_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE hrms_simple TO hrms_user;
```

### 3. Project Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.simple .env

# Edit .env with your database URL:
# DATABASE_URL="postgresql://hrms_user:password123@localhost:5432/hrms_simple"

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### 4. Access Application
- URL: http://localhost:5000  
- Login: admin / admin123

## Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types & schemas
├── package.json     # Dependencies
└── .env            # Environment config
```

## Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run db:push    # Update database schema
```

## Default Login
- **Username**: admin
- **Password**: admin123

## Features Overview

### Employee Management
- Add, edit, and view employee profiles
- Department assignment and organization
- Employee search and filtering

### Attendance System  
- Manual punch in/out functionality
- Daily attendance tracking
- Attendance reports and summaries

### Leave Management
- Leave application submission
- Approval workflow for managers
- Leave balance tracking by type

### Payroll Processing
- Basic salary calculations
- Payroll record management
- Simple reporting

### Dashboard
- Employee statistics
- Attendance overview  
- Quick action buttons

## Development

### Adding New Features
1. Database: Update `shared/schema.ts`
2. Backend: Add routes in `server/routes.ts`
3. Frontend: Create components in `client/src/`

### Database Operations
- All database operations use Drizzle ORM
- Schema changes require `npm run db:push`
- Data is stored in PostgreSQL

## Support
- Check terminal for error messages
- Verify PostgreSQL is running
- Ensure database connection string is correct
- Check that port 5000 is available

## License
MIT License