// Employee Management Tests
import http from 'http';

class EmployeeTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.cookies = '';
  }

  async makeRequest(method, path, data = null, cookies = '') {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || this.cookies
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
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null
            };
            resolve(result);
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

  async testEmployeeCreation() {
    console.log('\n=== Employee Management Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for employee tests');
      return;
    }

    // Test 1: Get departments (required for employee creation)
    try {
      const deptResult = await this.makeRequest('GET', '/api/departments');
      if (deptResult.status === 200 && Array.isArray(deptResult.data)) {
        console.log('✅ Departments fetched successfully');
        this.testResults.push({ test: 'Get Departments', status: 'PASS' });
        
        // Test 2: Create new employee with valid data
        const newEmployee = {
          employeeId: `EMP${Date.now()}`,
          companyId: 'default-company',
          joinDate: '2024-01-15',
          salary: '60000',
          name: 'Test Employee',
          email: `test${Date.now()}@example.com`,
          phone: '1234567890',
          designation: 'Test Engineer',
          departmentId: deptResult.data[0].id
        };

        const createResult = await this.makeRequest('POST', '/api/employees', newEmployee);
        if (createResult.status === 201 && createResult.data.id) {
          console.log('✅ Employee created successfully');
          this.testResults.push({ test: 'Create Employee', status: 'PASS', data: createResult.data });
          
          // Test 3: Get the created employee
          const getResult = await this.makeRequest('GET', `/api/employees/${createResult.data.id}`);
          if (getResult.status === 200) {
            console.log('✅ Employee retrieved successfully');
            this.testResults.push({ test: 'Get Employee', status: 'PASS' });
          } else {
            console.log('❌ Failed to retrieve employee');
            this.testResults.push({ test: 'Get Employee', status: 'FAIL' });
          }

          // Test 4: Update employee
          const updateData = {
            name: 'Updated Test Employee',
            designation: 'Senior Test Engineer'
          };
          const updateResult = await this.makeRequest('PUT', `/api/employees/${createResult.data.id}`, updateData);
          if (updateResult.status === 200) {
            console.log('✅ Employee updated successfully');
            this.testResults.push({ test: 'Update Employee', status: 'PASS' });
          } else {
            console.log('❌ Failed to update employee');
            this.testResults.push({ test: 'Update Employee', status: 'FAIL' });
          }

        } else {
          console.log('❌ Failed to create employee:', createResult.data);
          this.testResults.push({ test: 'Create Employee', status: 'FAIL', error: createResult.data });
        }

      } else {
        console.log('❌ Failed to fetch departments');
        this.testResults.push({ test: 'Get Departments', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Employee creation test error:', error.message);
      this.testResults.push({ test: 'Employee Creation Flow', status: 'ERROR', error: error.message });
    }

    // Test 5: Create employee with invalid data
    try {
      const invalidEmployee = {
        employeeId: '',
        companyId: '',
        name: '',
        email: 'invalid-email',
        salary: 'not-a-number'
      };

      const invalidResult = await this.makeRequest('POST', '/api/employees', invalidEmployee);
      if (invalidResult.status === 400) {
        console.log('✅ Invalid employee data properly rejected');
        this.testResults.push({ test: 'Invalid Employee Validation', status: 'PASS' });
      } else {
        console.log('❌ Invalid employee data not properly validated');
        this.testResults.push({ test: 'Invalid Employee Validation', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Invalid employee validation test error:', error.message);
      this.testResults.push({ test: 'Invalid Employee Validation', status: 'ERROR', error: error.message });
    }

    // Test 6: Get all employees
    try {
      const allEmployeesResult = await this.makeRequest('GET', '/api/employees');
      if (allEmployeesResult.status === 200 && Array.isArray(allEmployeesResult.data)) {
        console.log(`✅ Retrieved ${allEmployeesResult.data.length} employees`);
        this.testResults.push({ test: 'Get All Employees', status: 'PASS', count: allEmployeesResult.data.length });
      } else {
        console.log('❌ Failed to get all employees');
        this.testResults.push({ test: 'Get All Employees', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Get all employees test error:', error.message);
      this.testResults.push({ test: 'Get All Employees', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default EmployeeTester;