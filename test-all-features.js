#!/usr/bin/env node

// Comprehensive HRMS Feature Testing Script
const baseUrl = 'http://localhost:5000';
let cookies = '';

// Test credentials
const testCredentials = {
  admin: { username: 'admin', password: 'admin123' },
  hr: { username: 'sarah.johnson', password: 'sarah123' },
  employee: { username: 'john.smith', password: 'john123' }
};

async function makeRequest(method, endpoint, data = null, useCookies = true) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  if (useCookies && cookies) {
    options.headers.Cookie = cookies;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    // Store cookies from response
    if (response.headers.get('set-cookie')) {
      cookies = response.headers.get('set-cookie');
    }
    
    const text = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      data: text ? JSON.parse(text) : null
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testLogin(role) {
  console.log(`\n🔐 Testing ${role} login...`);
  const credentials = testCredentials[role];
  const result = await makeRequest('POST', '/api/auth/login', credentials, false);
  
  if (result.ok) {
    console.log(`✅ ${role} login successful`);
    return true;
  } else {
    console.log(`❌ ${role} login failed:`, result.data?.error || 'Unknown error');
    return false;
  }
}

async function testEmployeeOperations() {
  console.log('\n👥 Testing Employee Operations...');
  
  // Get employees
  let result = await makeRequest('GET', '/api/employees');
  if (result.ok) {
    console.log(`✅ Get employees: ${result.data?.length || 0} employees found`);
  } else {
    console.log('❌ Get employees failed:', result.data?.error);
  }
  
  // Test create employee
  const newEmployee = {
    companyId: 'default-company',
    employeeId: `TEST-${Date.now()}`,
    name: 'Test Employee API',
    email: `test${Date.now()}@example.com`,
    phone: '9876543210',
    designation: 'API Tester',
    departmentId: '45beea93-5703-43b0-8870-1d025fc10519',
    joinDate: '2025-01-01',
    salary: '50000'
  };
  
  result = await makeRequest('POST', '/api/employees', newEmployee);
  if (result.ok) {
    console.log('✅ Create employee successful');
    return result.data.id;
  } else {
    console.log('❌ Create employee failed:', result.data?.error);
    return null;
  }
}

async function testLeaveOperations(employeeId) {
  console.log('\n🏖️ Testing Leave Operations...');
  
  // Get leave applications
  let result = await makeRequest('GET', '/api/leave-applications');
  if (result.ok) {
    console.log(`✅ Get leave applications: ${result.data?.length || 0} applications found`);
  } else {
    console.log('❌ Get leave applications failed:', result.data?.error);
  }
  
  // Create leave application
  const leaveApp = {
    employeeId: employeeId || 'test-emp',
    leaveType: 'annual',
    fromDate: '2025-08-20',
    toDate: '2025-08-22',
    reason: 'API Testing Leave',
    totalDays: 3
  };
  
  result = await makeRequest('POST', '/api/leave-applications', leaveApp);
  if (result.ok) {
    console.log('✅ Create leave application successful');
    return result.data.id;
  } else {
    console.log('❌ Create leave application failed:', result.data?.error);
    return null;
  }
}

async function testAttendanceOperations(employeeId) {
  console.log('\n⏰ Testing Attendance Operations...');
  
  // Get attendance records
  let result = await makeRequest('GET', '/api/attendance/today');
  if (result.ok) {
    console.log(`✅ Get today attendance: ${result.data?.length || 0} records found`);
  } else {
    console.log('❌ Get attendance failed:', result.data?.error);
  }
  
  // Test punch in
  result = await makeRequest('POST', '/api/attendance/punch-in', { employeeId: employeeId || 'test-emp' });
  if (result.ok) {
    console.log('✅ Punch in successful');
  } else {
    console.log('❌ Punch in failed:', result.data?.error);
  }
}

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Stats...');
  
  const result = await makeRequest('GET', '/api/dashboard/stats');
  if (result.ok) {
    console.log('✅ Dashboard stats loaded successfully');
    console.log(`   - Total Employees: ${result.data.totalEmployees}`);
    console.log(`   - Present Today: ${result.data.presentToday}`);
    console.log(`   - Pending Leaves: ${result.data.pendingLeaves}`);
  } else {
    console.log('❌ Dashboard stats failed:', result.data?.error);
  }
}

async function testApprovalSystem() {
  console.log('\n✅ Testing Approval System...');
  
  const result = await makeRequest('GET', '/api/approvals/pending');
  if (result.ok) {
    console.log(`✅ Get pending approvals: ${result.data?.length || 0} pending approvals`);
  } else {
    console.log('❌ Get approvals failed:', result.data?.error);
  }
}

async function testDepartments() {
  console.log('\n🏢 Testing Departments...');
  
  const result = await makeRequest('GET', '/api/departments');
  if (result.ok) {
    console.log(`✅ Get departments: ${result.data?.length || 0} departments found`);
  } else {
    console.log('❌ Get departments failed:', result.data?.error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive HRMS API Testing...');
  console.log('=' .repeat(50));
  
  // Test admin login and operations
  const adminLoggedIn = await testLogin('admin');
  if (!adminLoggedIn) return;
  
  // Run all admin tests
  await testDashboardStats();
  await testDepartments();
  const newEmployeeId = await testEmployeeOperations();
  const leaveAppId = await testLeaveOperations(newEmployeeId);
  await testAttendanceOperations(newEmployeeId);
  await testApprovalSystem();
  
  // Test HR login
  cookies = ''; // Clear cookies
  const hrLoggedIn = await testLogin('hr');
  if (hrLoggedIn) {
    console.log('✅ HR user can access system');
  }
  
  // Test Employee login  
  cookies = ''; // Clear cookies
  const empLoggedIn = await testLogin('employee');
  if (empLoggedIn) {
    console.log('✅ Employee user can access system');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 API Testing Complete!');
  console.log('Check the results above for any failures that need attention.');
}

// Run the tests
runAllTests().catch(console.error);