// Database Integration Tests
import http from 'http';

class DatabaseTester {
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

  async testDatabaseOperations() {
    console.log('\n=== Database Integration Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for database tests');
      return;
    }

    // Test 1: Data Consistency - Create and Retrieve
    try {
      const timestamp = Date.now();
      const newEmployee = {
        employeeId: `DB_TEST_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '55000',
        name: 'Database Test Employee',
        email: `dbtest${timestamp}@example.com`,
        phone: '9876543210',
        designation: 'Database Tester',
        departmentId: 'test-dept-id'
      };

      // Get a real department ID first
      const deptResult = await this.makeRequest('GET', '/api/departments');
      if (deptResult.status === 200 && deptResult.data.length > 0) {
        newEmployee.departmentId = deptResult.data[0].id;
        
        const createResult = await this.makeRequest('POST', '/api/employees', newEmployee);
        if (createResult.status === 201) {
          const employeeId = createResult.data.id;
          
          // Retrieve the created employee
          const getResult = await this.makeRequest('GET', `/api/employees/${employeeId}`);
          if (getResult.status === 200 && getResult.data.name === newEmployee.name) {
            console.log('✅ Database CREATE and READ operations working');
            this.testResults.push({ test: 'Database CREATE/READ', status: 'PASS' });
          } else {
            console.log('❌ Database READ operation failed');
            this.testResults.push({ test: 'Database CREATE/READ', status: 'FAIL' });
          }
        } else {
          console.log('❌ Database CREATE operation failed');
          this.testResults.push({ test: 'Database CREATE/READ', status: 'FAIL' });
        }
      } else {
        console.log('❌ Could not get departments for database test');
        this.testResults.push({ test: 'Database CREATE/READ', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Database CREATE/READ test error:', error.message);
      this.testResults.push({ test: 'Database CREATE/READ', status: 'ERROR', error: error.message });
    }

    // Test 2: Foreign Key Constraints
    try {
      const invalidEmployee = {
        employeeId: 'FK_TEST',
        companyId: 'non-existent-company',
        joinDate: '2024-01-15',
        salary: '50000',
        name: 'FK Test Employee',
        email: 'fktest@example.com',
        phone: '1234567890',
        designation: 'FK Tester',
        departmentId: 'non-existent-dept'
      };

      const result = await this.makeRequest('POST', '/api/employees', invalidEmployee);
      if (result.status >= 400) {
        console.log('✅ Foreign key constraints working');
        this.testResults.push({ test: 'Foreign Key Constraints', status: 'PASS' });
      } else {
        console.log('❌ Foreign key constraints not working');
        this.testResults.push({ test: 'Foreign Key Constraints', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Foreign key constraints test error:', error.message);
      this.testResults.push({ test: 'Foreign Key Constraints', status: 'ERROR', error: error.message });
    }

    // Test 3: Data Relationships
    try {
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      const departmentsResult = await this.makeRequest('GET', '/api/departments');
      
      if (employeesResult.status === 200 && departmentsResult.status === 200) {
        const employees = employeesResult.data;
        const departments = departmentsResult.data;
        
        // Check if employees have valid department references
        let validRelationships = true;
        for (const employee of employees) {
          const deptExists = departments.some(dept => dept.id === employee.departmentId);
          if (!deptExists) {
            validRelationships = false;
            break;
          }
        }
        
        if (validRelationships) {
          console.log('✅ Data relationships intact');
          this.testResults.push({ test: 'Data Relationships', status: 'PASS' });
        } else {
          console.log('❌ Data relationships broken');
          this.testResults.push({ test: 'Data Relationships', status: 'FAIL' });
        }
      } else {
        console.log('❌ Could not verify data relationships');
        this.testResults.push({ test: 'Data Relationships', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Data relationships test error:', error.message);
      this.testResults.push({ test: 'Data Relationships', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default DatabaseTester;