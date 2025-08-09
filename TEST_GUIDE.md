# HRMS Testing Guide

## Overview
This HRMS project includes comprehensive end-to-end testing for both frontend and backend components.

## Test Structure

### Backend Tests (Mocha + Chai + Supertest)
Located in `tests/backend/`

- **Authentication Tests** (`auth.test.ts`)
  - Login/logout functionality
  - Session management
  - Authorization middleware

- **Employee Management Tests** (`employees.test.ts`)
  - CRUD operations for employees
  - Validation testing
  - Data integrity checks

- **Attendance Tests** (`attendance.test.ts`)
  - Punch in/out functionality
  - Attendance record retrieval
  - Time calculations

- **Leave Management Tests** (`leaves.test.ts`)
  - Leave type management
  - Leave applications
  - Bulk leave assignments

- **Payroll Tests** (`payroll.test.ts`)
  - Payroll record management
  - Salary calculations
  - Performance testing

### Frontend Tests (Jest + React Testing Library)
Located in `tests/frontend/components/`

- **Login Component Tests** (`Login.test.tsx`)
  - Form validation
  - Authentication flow
  - Error handling

- **Employee List Tests** (`EmployeeList.test.tsx`)
  - Data display
  - Search functionality
  - CRUD operations

- **Attendance Dashboard Tests** (`Attendance.test.tsx`)
  - Record display
  - Status badges
  - Time formatting

- **Dashboard Tests** (`Dashboard.test.tsx`)
  - Statistics display
  - Recent activities
  - Quick actions

## Running Tests

### Individual Test Commands

#### Backend Tests
```bash
# All backend tests
npx mocha tests/backend/**/*.test.ts --require tsx/esm --timeout 10000

# Specific test files
npx mocha tests/backend/auth.test.ts --require tsx/esm --timeout 10000
npx mocha tests/backend/employees.test.ts --require tsx/esm --timeout 10000
npx mocha tests/backend/attendance.test.ts --require tsx/esm --timeout 10000
```

#### Frontend Tests
```bash
# All frontend tests
npx jest --config jest.config.js

# With coverage
npx jest --config jest.config.js --coverage

# Watch mode
npx jest --config jest.config.js --watch

# Specific test files
npx jest tests/frontend/components/Login.test.tsx
npx jest tests/frontend/components/EmployeeList.test.tsx
```

### Complete Test Suite
```bash
# Run the full test suite
./run-tests.sh

# Demo with examples
./test-demo.sh
```

## Test Configuration Files

- `jest.config.js` - Jest configuration for frontend testing
- `mocha.config.js` - Mocha configuration for backend testing
- `tests/frontend/setup.ts` - Frontend test setup and mocks
- `tests/backend/setup.ts` - Backend test database setup

## Key Testing Features

### Backend Testing
- **API Integration Testing** - Full HTTP request/response testing
- **Authentication Flow** - Session-based auth testing
- **Database Operations** - CRUD operations with test data
- **Error Handling** - Validation and error response testing
- **Performance Testing** - Response time validation

### Frontend Testing
- **Component Rendering** - UI component display testing
- **User Interactions** - Button clicks, form submissions
- **State Management** - React Query integration testing
- **Error States** - Loading and error condition testing
- **Accessibility** - Screen reader and keyboard navigation

## Test Data
- Tests use isolated test environments
- Backend tests clear database between runs
- Frontend tests use mocked API responses
- Sample data is generated for realistic testing scenarios

## Coverage Reports
- Frontend coverage: `coverage/frontend/`
- Coverage includes line, branch, and function coverage
- HTML reports available for detailed analysis

## Best Practices

1. **Isolation** - Each test runs independently
2. **Realistic Data** - Use authentic data structures
3. **Error Testing** - Test both success and failure scenarios
4. **Performance** - Include response time validation
5. **Accessibility** - Test for screen reader compatibility

## Troubleshooting

### Common Issues
- **Database Constraints** - Foreign key violations in test cleanup
- **ES Module Issues** - Use tsx/esm for TypeScript execution
- **Mock Conflicts** - Clear mocks between test runs
- **Timeout Issues** - Increase timeout for slow operations

### Debug Commands
```bash
# Run with verbose output
npx mocha tests/backend/**/*.test.ts --require tsx/esm --reporter spec

# Jest debug mode
npx jest --config jest.config.js --verbose

# Check test file syntax
npx tsc --noEmit tests/backend/auth.test.ts
```

## Integration with CI/CD
The test suite is designed to run in continuous integration environments:
- Exit codes indicate pass/fail status
- Coverage reports can be uploaded to services
- Tests can run in parallel for faster execution
- Database setup is automated for consistent environments