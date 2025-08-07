// API Endpoints Comprehensive Test
import http from 'http';

class ApiEndpointTester {
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

  async testAllEndpoints() {
    console.log('\n=== API Endpoints Comprehensive Test ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for API endpoint tests');
      return;
    }

    const endpoints = [
      { method: 'GET', path: '/api/auth/user', description: 'Get Current User' },
      { method: 'GET', path: '/api/employees', description: 'Get All Employees' },
      { method: 'GET', path: '/api/departments', description: 'Get All Departments' },
      { method: 'GET', path: '/api/attendance', description: 'Get Attendance Records' },
      { method: 'GET', path: '/api/attendance/today', description: 'Get Today Attendance' },
      { method: 'GET', path: '/api/leave-applications', description: 'Get Leave Applications' },
      { method: 'GET', path: '/api/approvals/pending', description: 'Get Pending Approvals' },
      { method: 'GET', path: '/api/payroll', description: 'Get Payroll Records' },
      { method: 'GET', path: '/api/dashboard/stats', description: 'Get Dashboard Statistics' }
    ];

    for (const endpoint of endpoints) {
      try {
        const result = await this.makeRequest(endpoint.method, endpoint.path);
        if (result.status >= 200 && result.status < 400) {
          console.log(`✅ ${endpoint.description}: ${result.status}`);
          this.testResults.push({ 
            test: endpoint.description, 
            status: 'PASS', 
            endpoint: `${endpoint.method} ${endpoint.path}`,
            statusCode: result.status
          });
        } else {
          console.log(`❌ ${endpoint.description}: ${result.status}`);
          this.testResults.push({ 
            test: endpoint.description, 
            status: 'FAIL', 
            endpoint: `${endpoint.method} ${endpoint.path}`,
            statusCode: result.status
          });
        }
      } catch (error) {
        console.log(`❌ ${endpoint.description}: ERROR - ${error.message}`);
        this.testResults.push({ 
          test: endpoint.description, 
          status: 'ERROR', 
          endpoint: `${endpoint.method} ${endpoint.path}`,
          error: error.message
        });
      }
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default ApiEndpointTester;