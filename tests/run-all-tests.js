// Main Test Runner
import AuthTester from './auth.test.js';
import EmployeeTester from './employee.test.js';
import AttendanceTester from './attendance.test.js';
import CryptoTester from './crypto.test.js';
import ValidationTester from './validation.test.js';
import ApiEndpointTester from './api-endpoints.test.js';
import DatabaseTester from './database.test.js';
import FrontendIntegrationTester from './frontend-integration.test.js';
import SystemFlowTester from './system-flow.test.js';

async function runAllTests() {
  console.log('🧪 Starting HRMS System Testing Suite');
  console.log('=====================================\n');

  const allResults = {
    auth: [],
    employee: [],
    attendance: [],
    crypto: [],
    validation: [],
    apiEndpoints: [],
    database: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: 0
    }
  };

  try {
    // Authentication Tests
    const authTester = new AuthTester();
    await authTester.testLogin();
    await authTester.testEmployeeLogin();
    allResults.auth = authTester.getResults();

    // Employee Management Tests
    const employeeTester = new EmployeeTester();
    await employeeTester.testEmployeeCreation();
    allResults.employee = employeeTester.getResults();

    // Attendance System Tests
    const attendanceTester = new AttendanceTester();
    await attendanceTester.testAttendanceSystem();
    allResults.attendance = attendanceTester.getResults();

    // Validation Tests
    const validationTester = new ValidationTester();
    await validationTester.testValidation();
    allResults.validation = validationTester.getResults();

    // Cryptographic Tests
    const cryptoTester = new CryptoTester();
    await cryptoTester.testPasswordHashing();
    allResults.crypto = cryptoTester.getResults();

    // API Endpoint Tests
    const apiTester = new ApiEndpointTester();
    await apiTester.testAllEndpoints();
    allResults.apiEndpoints = apiTester.getResults();

    // Database Integration Tests
    const dbTester = new DatabaseTester();
    await dbTester.testDatabaseOperations();
    allResults.database = dbTester.getResults();

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  }

  // Calculate summary
  const allTestResults = [
    ...allResults.auth,
    ...allResults.employee,
    ...allResults.attendance,
    ...allResults.validation,
    ...allResults.crypto,
    ...allResults.apiEndpoints,
    ...allResults.database
  ];

  allResults.summary.totalTests = allTestResults.length;
  allResults.summary.passed = allTestResults.filter(t => t.status === 'PASS').length;
  allResults.summary.failed = allTestResults.filter(t => t.status === 'FAIL').length;
  allResults.summary.errors = allTestResults.filter(t => t.status === 'ERROR').length;

  // Generate detailed report
  generateTestReport(allResults);

  return allResults;
}

function generateTestReport(results) {
  console.log('\n\n📊 HRMS TESTING REPORT');
  console.log('======================');
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total Tests: ${results.summary.totalTests}`);
  console.log(`  ✅ Passed: ${results.summary.passed}`);
  console.log(`  ❌ Failed: ${results.summary.failed}`);
  console.log(`  ⚠️  Errors: ${results.summary.errors}`);
  console.log(`  Success Rate: ${((results.summary.passed / results.summary.totalTests) * 100).toFixed(1)}%`);

  // Detailed results by category
  const categories = [
    { name: 'Authentication', results: results.auth },
    { name: 'Employee Management', results: results.employee },
    { name: 'Attendance System', results: results.attendance },
    { name: 'Form Validation', results: results.validation },
    { name: 'Cryptographic Security', results: results.crypto },
    { name: 'API Endpoints', results: results.apiEndpoints },
    { name: 'Database Integration', results: results.database }
  ];

  categories.forEach(category => {
    if (category.results.length > 0) {
      console.log(`\n🔍 ${category.name} Tests:`);
      category.results.forEach(test => {
        const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${statusIcon} ${test.test}: ${test.status}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
        if (test.count !== undefined) {
          console.log(`    Count: ${test.count}`);
        }
      });
    }
  });

  // Critical Issues
  const failedTests = [
    ...results.auth,
    ...results.employee,
    ...results.attendance,
    ...results.validation,
    ...results.crypto,
    ...results.apiEndpoints,
    ...results.database
  ].filter(t => t.status === 'FAIL' || t.status === 'ERROR');

  if (failedTests.length > 0) {
    console.log('\n🚨 Critical Issues Found:');
    failedTests.forEach(test => {
      console.log(`  • ${test.test}: ${test.status}`);
      if (test.error) {
        console.log(`    Reason: ${test.error}`);
      }
    });
  } else {
    console.log('\n🎉 All Critical Tests Passed!');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (results.summary.failed > 0) {
    console.log('  • Review and fix failing tests before production deployment');
  }
  if (results.summary.errors > 0) {
    console.log('  • Investigate error conditions and add proper error handling');
  }
  if (results.summary.passed === results.summary.totalTests) {
    console.log('  • System is ready for production deployment');
    console.log('  • Consider adding more edge case tests');
    console.log('  • Implement continuous testing in CI/CD pipeline');
  }

  console.log('\n📋 Test Completion Time:', new Date().toISOString());
  console.log('=====================================\n');
}

// Run tests if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runAllTests().then(() => {
    console.log('Testing complete!');
    process.exit(0);
  }).catch(error => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}

export { runAllTests, generateTestReport };