// UI Components and Button Testing
import http from 'http';

class UIComponentTester {
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

  async testUIFunctionalities() {
    console.log('\n=== UI Components and Functionality Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for UI tests');
      return;
    }

    // Test 1: Employee Form Submission (simulating UI button click)
    try {
      const timestamp = Date.now();
      const formData = {
        employeeId: `UI_TEST_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '48000',
        name: 'UI Test Employee',
        email: `uitest${timestamp}@example.com`,
        phone: '5555555555',
        designation: 'UI Tester',
        departmentId: 'test-dept'
      };

      // Get a valid department first
      const deptResult = await this.makeRequest('GET', '/api/departments');
      if (deptResult.status === 200 && deptResult.data.length > 0) {
        formData.departmentId = deptResult.data[0].id;
        
        const submitResult = await this.makeRequest('POST', '/api/employees', formData);
        if (submitResult.status === 201) {
          console.log('✅ Employee form submission working');
          this.testResults.push({ test: 'Employee Form Submit Button', status: 'PASS' });
        } else {
          console.log('❌ Employee form submission failed');
          this.testResults.push({ test: 'Employee Form Submit Button', status: 'FAIL' });
        }
      } else {
        console.log('❌ Could not get departments for form test');
        this.testResults.push({ test: 'Employee Form Submit Button', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Form submission test error:', error.message);
      this.testResults.push({ test: 'Employee Form Submit Button', status: 'ERROR', error: error.message });
    }

    // Test 2: Attendance Punch In Button
    try {
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployeeId = employeesResult.data[0].id;
        
        const punchInResult = await this.makeRequest('POST', '/api/attendance/punch-in', {
          employeeId: testEmployeeId
        });
        
        if (punchInResult.status === 200) {
          console.log('✅ Punch In button functionality working');
          this.testResults.push({ test: 'Punch In Button', status: 'PASS' });
        } else {
          console.log('❌ Punch In button functionality failed');
          this.testResults.push({ test: 'Punch In Button', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for punch in test');
        this.testResults.push({ test: 'Punch In Button', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Punch In button test error:', error.message);
      this.testResults.push({ test: 'Punch In Button', status: 'ERROR', error: error.message });
    }

    // Test 3: Dashboard Data Loading
    try {
      const dashboardResult = await this.makeRequest('GET', '/api/dashboard/stats');
      if (dashboardResult.status === 200 && dashboardResult.data) {
        console.log('✅ Dashboard data loading working');
        this.testResults.push({ test: 'Dashboard Load', status: 'PASS' });
      } else {
        console.log('❌ Dashboard data loading failed');
        this.testResults.push({ test: 'Dashboard Load', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Dashboard loading test error:', error.message);
      this.testResults.push({ test: 'Dashboard Load', status: 'ERROR', error: error.message });
    }

    // Test 4: Leave Application Submission
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
          reason: 'Test leave application'
        };
        
        const leaveResult = await this.makeRequest('POST', '/api/leave-applications', leaveData);
        if (leaveResult.status === 201) {
          console.log('✅ Leave application submission working');
          this.testResults.push({ test: 'Leave Apply Button', status: 'PASS' });
        } else {
          console.log('❌ Leave application submission failed');
          this.testResults.push({ test: 'Leave Apply Button', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for leave application test');
        this.testResults.push({ test: 'Leave Apply Button', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Leave application test error:', error.message);
      this.testResults.push({ test: 'Leave Apply Button', status: 'ERROR', error: error.message });
    }

    // Test 5: Employee Update Functionality
    try {
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployee = employeesResult.data[0];
        
        const updateData = {
          name: `${testEmployee.name} Updated`,
          designation: 'Updated Designation'
        };
        
        const updateResult = await this.makeRequest('PUT', `/api/employees/${testEmployee.id}`, updateData);
        if (updateResult.status === 200) {
          console.log('✅ Employee update functionality working');
          this.testResults.push({ test: 'Employee Update Button', status: 'PASS' });
        } else {
          console.log('❌ Employee update functionality failed');
          this.testResults.push({ test: 'Employee Update Button', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for update test');
        this.testResults.push({ test: 'Employee Update Button', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Employee update test error:', error.message);
      this.testResults.push({ test: 'Employee Update Button', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default UIComponentTester;