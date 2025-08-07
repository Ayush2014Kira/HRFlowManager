# Overview

This is a comprehensive Human Resource Management System (HRMS) built with a modern full-stack architecture. The application provides core HR functionalities including employee management, attendance tracking, leave management, payroll processing, and approval workflows. It's designed as a web-based solution with a React frontend and Express.js backend, using PostgreSQL for data persistence.

## Recent Major Achievement (August 2025)
**Simplified HRMS Setup Complete**: Successfully created a clean, simple HRMS system:
- ✅ **Core Employee Management**: Add, view, edit employees with department assignment
- ✅ **Manual Attendance System**: Punch in/out functionality working perfectly
- ✅ **Leave Management**: Leave applications with approval workflow
- ✅ **Basic Payroll Processing**: Salary calculations and records
- ✅ **Simple Authentication**: Username/password login system
- ✅ **Clean Setup Files**: Local development guides and GitHub-ready structure
- ❌ **Removed Complexity**: No eSSL, AI, GPS, or Vercel deployment configs

# User Preferences

Preferred communication style: Simple, everyday language.
Target platforms: Web and mobile applications (React Native support requested)
Business requirements: Multi-company HRMS with eSSL integration, advanced hour calculation, mobile-first approach

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **API Design**: RESTful endpoints organized by resource (employees, attendance, leaves, payroll, approvals)
- **Middleware**: Custom logging middleware for API request monitoring
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data storage
- **Database Client**: Neon serverless PostgreSQL for cloud deployment
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Connection Pooling**: Built-in connection pooling for optimal database performance

## Database Schema Design
The system uses a well-structured relational schema with the following core entities:
- **Users**: Authentication and user management
- **Departments**: Organizational structure
- **Employees**: Core employee information with department relationships
- **Attendance Records**: Time tracking with punch in/out functionality
- **Leave Management**: Leave balances, applications, and approval workflow
- **Payroll Records**: Salary calculations and payment tracking
- **Approval System**: Unified approval workflow for leaves and miss-punch requests

## Authentication and Authorization
- Multi-company user system with username/password authentication
- JWT-based authentication for mobile app compatibility
- Session-based authentication for web application
- Role-based access control (admin, hr, manager, employee)
- Company-specific user isolation and data segregation

## Development Architecture
- **Monorepo Structure**: Organized into client, server, and shared directories
- **Shared Types**: Common TypeScript interfaces and Zod schemas for validation
- **Development Server**: Vite dev server with Express backend integration
- **Hot Module Replacement**: Real-time updates during development
- **Build Process**: Separate client and server build pipelines

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Connection Management**: WebSocket-based database connections for improved performance

## UI and Component Libraries
- **Radix UI**: Comprehensive primitive component library for accessibility-first UI components
- **Lucide React**: Icon library for consistent iconography throughout the application
- **TanStack Query**: Server state management with intelligent caching and background updates
- **React Hook Form**: Form handling with validation integration
- **Zod**: Schema validation for runtime type checking

## Development Tools
- **Replit Integration**: Custom plugins for Replit development environment
- **TypeScript**: Full-stack type safety and developer tooling
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Utility Libraries
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition
- **CLSX**: Conditional CSS class name utility
- **Nanoid**: Unique ID generation for database records

## Production Dependencies
- **Express Session Management**: PostgreSQL-backed session storage for user authentication
- **CORS Handling**: Cross-origin resource sharing configuration for API access
- **Environment Configuration**: Environment-based configuration management