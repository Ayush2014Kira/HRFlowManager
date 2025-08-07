// Attendance System Tests
import http from 'http';

class AttendanceTester {
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

  async testAttendanceSystem() {
    console.log('\n=== Attendance System Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for attendance tests');
      return;
    }

    // Test 1: Get today's attendance
    try {
      const todayResult = await this.makeRequest('GET', '/api/attendance/today');
      if (todayResult.status === 200) {
        console.log('✅ Today\'s attendance fetched successfully');
        this.testResults.push({ test: 'Get Today Attendance', status: 'PASS', count: todayResult.data?.length || 0 });
      } else {
        console.log('❌ Failed to fetch today\'s attendance');
        this.testResults.push({ test: 'Get Today Attendance', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Today\'s attendance test error:', error.message);
      this.testResults.push({ test: 'Get Today Attendance', status: 'ERROR', error: error.message });
    }

    // Test 2: Punch in for an employee
    try {
      // First get an employee ID
      const employeesResult = await this.makeRequest('GET', '/api/employees');
      if (employeesResult.status === 200 && employeesResult.data.length > 0) {
        const testEmployeeId = employeesResult.data[0].id;
        
        const punchInResult = await this.makeRequest('POST', '/api/attendance/punch-in', {
          employeeId: testEmployeeId
        });
        
        if (punchInResult.status === 200) {
          console.log('✅ Punch in successful');
          this.testResults.push({ test: 'Punch In', status: 'PASS' });
          
          // Test 3: Punch out for the same employee
          setTimeout(async () => {
            try {
              const punchOutResult = await this.makeRequest('POST', '/api/attendance/punch-out', {
                employeeId: testEmployeeId
              });
              
              if (punchOutResult.status === 200) {
                console.log('✅ Punch out successful');
                this.testResults.push({ test: 'Punch Out', status: 'PASS' });
              } else {
                console.log('❌ Punch out failed');
                this.testResults.push({ test: 'Punch Out', status: 'FAIL' });
              }
            } catch (error) {
              console.log('❌ Punch out test error:', error.message);
              this.testResults.push({ test: 'Punch Out', status: 'ERROR', error: error.message });
            }
          }, 1000);
          
        } else {
          console.log('❌ Punch in failed');
          this.testResults.push({ test: 'Punch In', status: 'FAIL' });
        }
      } else {
        console.log('❌ No employees found for attendance test');
        this.testResults.push({ test: 'Punch In', status: 'FAIL', error: 'No employees found' });
      }
    } catch (error) {
      console.log('❌ Punch in test error:', error.message);
      this.testResults.push({ test: 'Punch In', status: 'ERROR', error: error.message });
    }

    // Test 4: Get attendance records
    try {
      const recordsResult = await this.makeRequest('GET', '/api/attendance');
      if (recordsResult.status === 200) {
        console.log('✅ Attendance records fetched successfully');
        this.testResults.push({ test: 'Get Attendance Records', status: 'PASS', count: recordsResult.data?.length || 0 });
      } else {
        console.log('❌ Failed to fetch attendance records');
        this.testResults.push({ test: 'Get Attendance Records', status: 'FAIL' });
      }
    } catch (error) {
      console.log('❌ Attendance records test error:', error.message);
      this.testResults.push({ test: 'Get Attendance Records', status: 'ERROR', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default AttendanceTester;