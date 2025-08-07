# HRMS Deployment Guide

## Environment Variables

### Required Environment Variables

Create a `.env` file with these variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
PGHOST=hostname
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name

# Application Configuration
NODE_ENV=production
SESSION_SECRET=your-super-secure-session-secret-key-here

# AI Features (Optional - for document generation)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Features (Optional - for notifications)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
```

### How to Get API Keys

#### OpenAI API Key (for AI document generation)
1. Go to https://platform.openai.com
2. Sign up or log in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the key starting with `sk-`

#### SendGrid API Key (for email notifications)
1. Go to https://sendgrid.com
2. Sign up for a free account (100 emails/day free)
3. Go to Settings → API Keys
4. Create a new API key with "Full Access"
5. Copy the key starting with `SG.`

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add all environment variables from above
   - Redeploy if needed

### Option 2: Deploy to Railway

1. **Connect your repository to Railway:**
   - Go to https://railway.app
   - Connect your GitHub repository

2. **Set environment variables:**
   - Add all variables from the list above

3. **Deploy automatically:**
   - Railway will build and deploy automatically

### Option 3: Deploy to Render

1. **Create account at https://render.com**

2. **Create new Web Service:**
   - Connect your repository
   - Set build command: `npm run build`
   - Set start command: `npm start`

3. **Add environment variables:**
   - Add all variables from the list above

## Database Setup

### Option 1: Neon (Recommended - Already configured)
- The system is already configured for Neon PostgreSQL
- Create account at https://neon.tech
- Create a database and get connection string
- Use the connection string as DATABASE_URL

### Option 2: Supabase
1. Go to https://supabase.com
2. Create a new project
3. Get the connection string from Settings → Database
4. Use format: `postgresql://postgres:password@host:5432/postgres`

### Option 3: ElephantSQL
1. Go to https://elephantsql.com
2. Create free account (20MB free)
3. Create instance and get connection URL

## Post-Deployment Setup

### 1. Database Migration
After deployment, run:
```bash
npm run db:push
```

### 2. Create Admin User
Access your deployed app and use these credentials:
- Username: `admin`
- Password: `admin123`

Or create via API:
```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin",
    "companyId": "your-company-id"
  }'
```

### 3. Sample Data Import
To import sample data:
```bash
curl -X POST https://your-app.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Features Available After Deployment

### Core Features ✅
- ✅ Employee management and profiles
- ✅ Attendance tracking with punch-in/out
- ✅ Leave application and approval system
- ✅ Payroll calculations
- ✅ Department and company management
- ✅ Dashboard with analytics
- ✅ Multi-user authentication with role-based access

### Advanced Features ✅
- ✅ eSSL biometric device integration (LAN/IP)
- ✅ GPS tracking for field work
- ✅ AI-powered document generation
- ✅ Mobile API for React Native apps
- ✅ Advanced reporting and analytics
- ✅ Miss-punch request system
- ✅ Field work visit tracking

## API Documentation

### Authentication Endpoints
```
POST /api/auth/login       - User login
POST /api/auth/register    - User registration
GET  /api/auth/user        - Get current user
POST /api/auth/logout      - User logout
```

### Employee Management
```
GET    /api/employees           - Get all employees
GET    /api/employees/:id       - Get specific employee
POST   /api/employees           - Create employee
PUT    /api/employees/:id       - Update employee
```

### Attendance Tracking
```
GET    /api/attendance                    - Get attendance records
GET    /api/attendance/today              - Get today's attendance
POST   /api/attendance/punch-in           - Employee punch-in
POST   /api/attendance/punch-out          - Employee punch-out
```

### eSSL Integration
```
GET    /api/essl/status                   - Get device status
POST   /api/essl/sync/:deviceId          - Manual device sync
```

### GPS Tracking
```
POST   /api/gps/update-location          - Update employee location
POST   /api/gps/start-fieldwork          - Start field work
PUT    /api/gps/end-fieldwork/:id        - End field work
GET    /api/gps/location-history/:id     - Location history
```

### AI Document Generation
```
POST   /api/ai/generate-document         - Generate any document
POST   /api/ai/generate-policy           - Generate policy document
POST   /api/ai/generate-offer-letter     - Generate offer letter
POST   /api/ai/generate-performance-review - Generate performance review
```

## Mobile App Support

The system includes mobile API endpoints for React Native integration:

### Mobile Authentication
```
POST   /api/mobile/login                 - Mobile login
GET    /api/mobile/profile               - Get user profile
POST   /api/mobile/punch-in              - Mobile punch-in
POST   /api/mobile/punch-out             - Mobile punch-out
GET    /api/mobile/attendance            - Get attendance history
POST   /api/mobile/leave-application     - Apply for leave
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check firewall settings

2. **Build Failures**
   - Run `npm run check` to verify TypeScript
   - Check all dependencies are installed
   - Verify Node.js version compatibility

3. **API Key Issues**
   - Verify OpenAI API key format (starts with sk-)
   - Check SendGrid API key format (starts with SG.)
   - Ensure keys have proper permissions

4. **eSSL Device Not Connecting**
   - Check IP address and port in device configuration
   - Verify network connectivity between server and device
   - Check device is powered on and network accessible

## Performance Optimization

### Database Optimization
- Indexes are automatically created by Drizzle ORM
- Connection pooling is handled by Neon connector
- Regular vacuum and analyze operations recommended

### Caching
- API responses are cached where appropriate
- Static assets served with proper cache headers
- Database query results cached for dashboard statistics

### Security
- All passwords are hashed with SHA-256
- SQL injection protection via parameterized queries
- CORS properly configured for API access
- Session management with secure cookies

## Support and Documentation

For additional help:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check database connectivity

The system is production-ready with comprehensive logging and error handling.