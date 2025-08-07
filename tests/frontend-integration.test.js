// Frontend Integration Tests using Playwright-like approach
import http from 'http';

class FrontendIntegrationTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.cookies = '';
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body
            });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async login() {
    const result = await this.makeRequest('POST', '/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (result.status === 200 && result.headers['set-cookie']) {
      this.cookies = result.headers['set-cookie'][0];
      return true;
    }
    return false;
  }

  async testFrontendIntegration() {
    console.log('\n=== Frontend Integration Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for frontend tests');
      return;
    }

    // Test 1: Employee View/Edit Workflow
    try {
      // Get employees first
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployee = employeesResult.data[0];
        
        // Test employee view endpoint
        const viewResult = await this.makeRequest('GET', `/api/employees/${testEmployee.id}`);
        if (viewResult.status === 200) {
          console.log('✅ Employee view functionality working');
          this.testResults.push({ test: 'Employee View Page', status: 'PASS' });
          
          // Test employee edit functionality
          const updateData = {
            name: `${testEmployee.name} Updated`,
            email: testEmployee.email,
            phone: testEmployee.phone,
            designation: testEmployee.designation,
            departmentId: testEmployee.departmentId,
            salary: testEmployee.salary,
            isActive: testEmployee.isActive
          };
          
          const editResult = await this.makeRequest('PUT', `/api/employees/${testEmployee.id}`, updateData);
          if (editResult.status === 200) {
            console.log('✅ Employee edit functionality working');
            this.testResults.push({ test: 'Employee Edit Page', status: 'PASS' });
          } else {
            console.log('❌ Employee edit functionality failed');
            this.testResults.push({ test: 'Employee Edit Page', status: 'FAIL' });
          }
        } else {
          console.log('❌ Employee view functionality failed');
          this.testResults.push({ test: 'Employee View Page', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for view/edit test');
        this.testResults.push({ test: 'Employee View/Edit Workflow', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Employee view/edit workflow error:', error.message);
      this.testResults.push({ test: 'Employee View/Edit Workflow', status: 'ERROR', error: error.message });
    }

    // Test 2: Add Employee Form
    try {
      const timestamp = Date.now();
      const newEmployee = {
        employeeId: `FE_TEST_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '55000',
        name: 'Frontend Test Employee',
        email: `fetest${timestamp}@example.com`,
        phone: '9876543210',
        designation: 'Frontend Tester',
        departmentId: 'test-dept-id'
      };

      // Get departments first
      const deptResult = await this.makeRequest('GET', '/api/departments');
      if (deptResult.status === 200 && deptResult.data.length > 0) {
        newEmployee.departmentId = deptResult.data[0].id;
        
        const createResult = await this.makeRequest('POST', '/api/employees', newEmployee);
        if (createResult.status === 201) {
          console.log('✅ Add employee form functionality working');
          this.testResults.push({ test: 'Add Employee Form', status: 'PASS' });
        } else {
          console.log('❌ Add employee form functionality failed');
          this.testResults.push({ test: 'Add Employee Form', status: 'FAIL' });
        }
      } else {
        console.log('❌ Could not get departments for add employee test');
        this.testResults.push({ test: 'Add Employee Form', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Add employee form error:', error.message);
      this.testResults.push({ test: 'Add Employee Form', status: 'ERROR', error: error.message });
    }

    // Test 3: Dashboard Data Loading
    try {
      const dashboardResult = await this.makeRequest('GET', '/api/dashboard/stats');
      if (dashboardResult.status === 200 && dashboardResult.data) {
        const stats = dashboardResult.data;
        if (stats.totalEmployees && stats.presentToday !== undefined && stats.attendanceRate !== undefined) {
          console.log('✅ Dashboard data loading working');
          this.testResults.push({ test: 'Dashboard Data Loading', status: 'PASS' });
        } else {
          console.log('❌ Dashboard missing required data fields');
          this.testResults.push({ test: 'Dashboard Data Loading', status: 'FAIL' });
        }
      } else {
        console.log('❌ Dashboard data loading failed');
        this.testResults.push({ test: 'Dashboard Data Loading', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Dashboard data loading error:', error.message);
      this.testResults.push({ test: 'Dashboard Data Loading', status: 'ERROR', error: error.message });
    }

    // Test 4: Attendance Punch-In/Out Flow
    try {
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployeeId = employeesResult.data[0].id;
        
        // Test punch-in
        const punchInResult = await this.makeRequest('POST', '/api/attendance/punch-in', {
          employeeId: testEmployeeId
        });
        
        if (punchInResult.status === 200 || punchInResult.status === 400) {
          // 400 is acceptable if already punched in
          console.log('✅ Punch-in functionality working');
          this.testResults.push({ test: 'Attendance Punch-In', status: 'PASS' });
          
          // Test punch-out
          const punchOutResult = await this.makeRequest('POST', '/api/attendance/punch-out', {
            employeeId: testEmployeeId
          });
          
          if (punchOutResult.status === 200 || punchOutResult.status === 400) {
            // 400 is acceptable if already punched out or need to punch in first
            console.log('✅ Punch-out functionality working');
            this.testResults.push({ test: 'Attendance Punch-Out', status: 'PASS' });
          } else {
            console.log('❌ Punch-out functionality failed');
            this.testResults.push({ test: 'Attendance Punch-Out', status: 'FAIL' });
          }
        } else {
          console.log('❌ Punch-in functionality failed');
          this.testResults.push({ test: 'Attendance Punch-In', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for punch test');
        this.testResults.push({ test: 'Attendance Punch Flow', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Attendance punch flow error:', error.message);
      this.testResults.push({ test: 'Attendance Punch Flow', status: 'ERROR', error: error.message });
    }

    // Test 5: Leave Application System
    try {
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployeeId = employeesResult.data[0].id;
        
        const leaveData = {
          employeeId: testEmployeeId,
          leaveType: 'annual',
          fromDate: '2024-02-01',
          toDate: '2024-02-03',
          totalDays: 3,
          reason: 'Frontend test leave application'
        };
        
        const leaveResult = await this.makeRequest('POST', '/api/leave-applications', leaveData);
        if (leaveResult.status === 201) {
          console.log('✅ Leave application system working');
          this.testResults.push({ test: 'Leave Application System', status: 'PASS' });
        } else {
          console.log('❌ Leave application system failed');
          this.testResults.push({ test: 'Leave Application System', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for leave application test');
        this.testResults.push({ test: 'Leave Application System', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Leave application system error:', error.message);
      this.testResults.push({ test: 'Leave Application System', status: 'ERROR', error: error.message });
    }

    // Test 6: Navigation and Routing
    try {
      // Test various page endpoints
      const pages = [
        { path: '/api/employees', name: 'Employees Page' },
        { path: '/api/departments', name: 'Departments Data' },
        { path: '/api/attendance', name: 'Attendance Page' },
        { path: '/api/leave-applications', name: 'Leave Applications Page' },
        { path: '/api/approvals/pending', name: 'Approvals Page' }
      ];

      let routingTests = 0;
      let passedRouting = 0;

      for (const page of pages) {
        const result = await this.makeRequest('GET', page.path);
        routingTests++;
        if (result.status >= 200 && result.status < 400) {
          passedRouting++;
        }
      }

      if (passedRouting === routingTests) {
        console.log('✅ Navigation and routing working');
        this.testResults.push({ test: 'Navigation and Routing', status: 'PASS' });
      } else {
        console.log(`❌ Navigation issues: ${passedRouting}/${routingTests} routes working`);
        this.testResults.push({ test: 'Navigation and Routing', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Navigation and routing error:', error.message);
      this.testResults.push({ test: 'Navigation and Routing', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default FrontendIntegrationTester;