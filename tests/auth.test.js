// Authentication Tests
import http from 'http';

class AuthTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
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
          'Cookie': cookies
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

  async testLogin() {
    console.log('\n=== Authentication Tests ===');
    
    // Test 1: Valid admin login
    try {
      const result = await this.makeRequest('POST', '/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      if (result.status === 200 && result.data.user) {
        console.log('✅ Admin login successful');
        this.testResults.push({ test: 'Admin Login', status: 'PASS' });
        return result.headers['set-cookie'] ? result.headers['set-cookie'][0] : '';
      } else {
        console.log('❌ Admin login failed');
        this.testResults.push({ test: 'Admin Login', status: 'FAIL', error: result.data });
      }
    } catch (error) {
      console.log('❌ Admin login error:', error.message);
      this.testResults.push({ test: 'Admin Login', status: 'ERROR', error: error.message });
    }

    // Test 2: Invalid login
    try {
      const result = await this.makeRequest('POST', '/api/auth/login', {
        username: 'invalid',
        password: 'wrong'
      });
      
      if (result.status === 401) {
        console.log('✅ Invalid login properly rejected');
        this.testResults.push({ test: 'Invalid Login Rejection', status: 'PASS' });
      } else {
        console.log('❌ Invalid login not properly handled');
        this.testResults.push({ test: 'Invalid Login Rejection', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Invalid login test error:', error.message);
      this.testResults.push({ test: 'Invalid Login Rejection', status: 'ERROR', error: error.message });
    }

    // Test 3: HR user login
    try {
      const result = await this.makeRequest('POST', '/api/auth/login', {
        username: 'sarah.johnson',
        password: 'sarah123'
      });
      
      if (result.status === 200 && result.data.user && result.data.user.role === 'hr') {
        console.log('✅ HR user login successful');
        this.testResults.push({ test: 'HR User Login', status: 'PASS' });
      } else {
        console.log('❌ HR user login failed');
        this.testResults.push({ test: 'HR User Login', status: 'FAIL', error: result.data });
      }
    } catch (error) {
      console.log('❌ HR user login error:', error.message);
      this.testResults.push({ test: 'HR User Login', status: 'ERROR', error: error.message });
    }

    return '';
  }

  async testEmployeeLogin() {
    // Test 4: Employee login
    try {
      const result = await this.makeRequest('POST', '/api/auth/login', {
        username: 'john.smith',
        password: 'john123'
      });
      
      if (result.status === 200 && result.data.user && result.data.user.role === 'employee') {
        console.log('✅ Employee login successful');
        this.testResults.push({ test: 'Employee Login', status: 'PASS' });
      } else {
        console.log('❌ Employee login failed');
        this.testResults.push({ test: 'Employee Login', status: 'FAIL', error: result.data });
      }
    } catch (error) {
      console.log('❌ Employee login error:', error.message);
      this.testResults.push({ test: 'Employee Login', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default AuthTester;