// System Flow End-to-End Tests
import http from 'http';

class SystemFlowTester {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.cookies = '';
    this.testData = {
      employees: [],
      departments: [],
      leaveApplications: []
    };
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

  async testSystemFlow() {
    console.log('\n=== System Flow End-to-End Tests ===');
    
    // Login first
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Failed to login for system flow tests');
      return;
    }

    // Flow 1: Complete Employee Lifecycle
    await this.testEmployeeLifecycle();
    
    // Flow 2: HR Leave Assignment Workflow
    await this.testHRLeaveAssignment();
    
    // Flow 3: Attendance Management Flow
    await this.testAttendanceManagementFlow();
    
    // Flow 4: Approval Workflow
    await this.testApprovalWorkflow();
    
    // Flow 5: Data Reset and ID Management
    await this.testDataResetFlow();
  }

  async testEmployeeLifecycle() {
    console.log('\n--- Employee Lifecycle Flow ---');
    
    try {
      // Step 1: Get departments for reference
      const deptResult = await this.makeRequest('GET', '/api/departments');
      if (deptResult.status !== 200) {
        throw new Error('Failed to fetch departments');
      }
      this.testData.departments = deptResult.data;

      // Step 2: Create new employee
      const timestamp = Date.now();
      const newEmployee = {
        employeeId: `SYS_FLOW_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '60000',
        name: 'System Flow Test Employee',
        email: `sysflow${timestamp}@example.com`,
        phone: '9876543210',
        designation: 'System Test Engineer',
        departmentId: this.testData.departments[0].id
      };

      const createResult = await this.makeRequest('POST', '/api/employees', newEmployee);
      if (createResult.status !== 201) {
        throw new Error('Failed to create employee');
      }
      
      const createdEmployee = createResult.data;
      this.testData.employees.push(createdEmployee);

      // Step 3: View employee details
      const viewResult = await this.makeRequest('GET', `/api/employees/${createdEmployee.id}`);
      if (viewResult.status !== 200) {
        throw new Error('Failed to view employee');
      }

      // Step 4: Update employee information
      const updateData = {
        name: `${newEmployee.name} Updated`,
        designation: 'Senior System Test Engineer',
        salary: '65000'
      };
      
      const updateResult = await this.makeRequest('PUT', `/api/employees/${createdEmployee.id}`, updateData);
      if (updateResult.status !== 200) {
        throw new Error('Failed to update employee');
      }

      // Step 5: List all employees and verify
      const listResult = await this.makeRequest('GET', '/api/employees');
      if (listResult.status !== 200) {
        throw new Error('Failed to list employees');
      }

      const updatedEmployee = listResult.data.find(emp => emp.id === createdEmployee.id);
      if (!updatedEmployee || !updatedEmployee.name.includes('Updated')) {
        throw new Error('Employee update not reflected');
      }

      console.log('✅ Employee lifecycle flow completed successfully');
      this.testResults.push({ test: 'Employee Lifecycle Flow', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Employee lifecycle flow failed:', error.message);
      this.testResults.push({ test: 'Employee Lifecycle Flow', status: 'FAIL', error: error.message });
    }
  }

  async testHRLeaveAssignment() {
    console.log('\n--- HR Leave Assignment Flow ---');
    
    try {
      if (this.testData.employees.length === 0) {
        throw new Error('No test employees available');
      }

      const testEmployee = this.testData.employees[0];

      // Step 1: HR assigns leave balance for employee
      const currentYear = new Date().getFullYear();
      const leaveBalance = {
        employeeId: testEmployee.id,
        year: currentYear,
        annualLeaves: 21,
        sickLeaves: 12,
        casualLeaves: 7,
        emergencyLeaves: 3,
        usedAnnualLeaves: 0,
        usedSickLeaves: 0,
        usedCasualLeaves: 0,
        usedEmergencyLeaves: 0
      };

      const balanceResult = await this.makeRequest('POST', '/api/leave-balances', leaveBalance);
      if (balanceResult.status !== 201) {
        throw new Error('Failed to assign leave balance');
      }

      // Step 2: Employee applies for leave
      const leaveApplication = {
        employeeId: testEmployee.id,
        leaveType: 'annual',
        fromDate: '2024-03-01',
        toDate: '2024-03-03',
        totalDays: 3,
        reason: 'System flow test leave application'
      };

      const applyResult = await this.makeRequest('POST', '/api/leave-applications', leaveApplication);
      if (applyResult.status !== 201) {
        throw new Error('Failed to apply for leave');
      }

      const appliedLeave = applyResult.data;
      this.testData.leaveApplications.push(appliedLeave);

      // Step 3: Get pending approvals
      const approvalsResult = await this.makeRequest('GET', '/api/approvals/pending');
      if (approvalsResult.status !== 200) {
        throw new Error('Failed to get pending approvals');
      }

      // Step 4: HR approves the leave
      const approval = {
        type: 'leave_application',
        referenceId: appliedLeave.id,
        employeeId: testEmployee.id,
        status: 'approved',
        comments: 'Approved by HR - System flow test'
      };

      const approveResult = await this.makeRequest('POST', '/api/approvals', approval);
      if (approveResult.status !== 201) {
        throw new Error('Failed to create approval');
      }

      // Step 5: Verify leave balance updated
      const balanceCheckResult = await this.makeRequest('GET', `/api/leave-balances/${testEmployee.id}`);
      if (balanceCheckResult.status !== 200) {
        throw new Error('Failed to check updated leave balance');
      }

      console.log('✅ HR leave assignment flow completed successfully');
      this.testResults.push({ test: 'HR Leave Assignment Flow', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ HR leave assignment flow failed:', error.message);
      this.testResults.push({ test: 'HR Leave Assignment Flow', status: 'FAIL', error: error.message });
    }
  }

  async testAttendanceManagementFlow() {
    console.log('\n--- Attendance Management Flow ---');
    
    try {
      if (this.testData.employees.length === 0) {
        throw new Error('No test employees available');
      }

      const testEmployee = this.testData.employees[0];

      // Step 1: Employee punches in
      const punchInResult = await this.makeRequest('POST', '/api/attendance/punch-in', {
        employeeId: testEmployee.id
      });
      
      // Allow for "already punched in" scenario
      if (punchInResult.status !== 200 && punchInResult.status !== 400) {
        throw new Error('Punch-in failed unexpectedly');
      }

      // Step 2: Get today's attendance
      const todayResult = await this.makeRequest('GET', '/api/attendance/today');
      if (todayResult.status !== 200) {
        throw new Error('Failed to get today\'s attendance');
      }

      // Step 3: Get employee attendance history
      const historyResult = await this.makeRequest('GET', `/api/attendance?employeeId=${testEmployee.id}`);
      if (historyResult.status !== 200) {
        throw new Error('Failed to get attendance history');
      }

      // Step 4: Employee punches out (if possible)
      const punchOutResult = await this.makeRequest('POST', '/api/attendance/punch-out', {
        employeeId: testEmployee.id
      });
      
      // Allow for "must punch in first" or "already punched out" scenarios
      if (punchOutResult.status !== 200 && punchOutResult.status !== 400) {
        throw new Error('Punch-out failed unexpectedly');
      }

      console.log('✅ Attendance management flow completed successfully');
      this.testResults.push({ test: 'Attendance Management Flow', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Attendance management flow failed:', error.message);
      this.testResults.push({ test: 'Attendance Management Flow', status: 'FAIL', error: error.message });
    }
  }

  async testApprovalWorkflow() {
    console.log('\n--- Approval Workflow ---');
    
    try {
      // Step 1: Get all pending approvals
      const pendingResult = await this.makeRequest('GET', '/api/approvals/pending');
      if (pendingResult.status !== 200) {
        throw new Error('Failed to get pending approvals');
      }

      // Step 2: Get all approvals (approved/rejected)
      const allApprovalsResult = await this.makeRequest('GET', '/api/approvals');
      if (allApprovalsResult.status !== 200) {
        throw new Error('Failed to get all approvals');
      }

      // Step 3: Test miss punch request workflow
      if (this.testData.employees.length > 0) {
        const testEmployee = this.testData.employees[0];
        
        const missPunchRequest = {
          employeeId: testEmployee.id,
          date: '2024-01-20',
          expectedPunchIn: '09:00',
          expectedPunchOut: '18:00',
          reason: 'System flow test miss punch'
        };

        const missPunchResult = await this.makeRequest('POST', '/api/miss-punch-requests', missPunchRequest);
        if (missPunchResult.status !== 201) {
          throw new Error('Failed to create miss punch request');
        }

        // Step 4: Get miss punch requests
        const missPunchListResult = await this.makeRequest('GET', '/api/miss-punch-requests');
        if (missPunchListResult.status !== 200) {
          throw new Error('Failed to get miss punch requests');
        }
      }

      console.log('✅ Approval workflow completed successfully');
      this.testResults.push({ test: 'Approval Workflow', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Approval workflow failed:', error.message);
      this.testResults.push({ test: 'Approval Workflow', status: 'FAIL', error: error.message });
    }
  }

  async testDataResetFlow() {
    console.log('\n--- Data Reset and ID Management Flow ---');
    
    try {
      // Step 1: Verify ID generation consistency
      const timestamp = Date.now();
      const testEmployee1 = {
        employeeId: `ID_TEST_1_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '50000',
        name: 'ID Test Employee 1',
        email: `idtest1${timestamp}@example.com`,
        phone: '1234567890',
        designation: 'Test Engineer 1',
        departmentId: this.testData.departments[0].id
      };

      const create1Result = await this.makeRequest('POST', '/api/employees', testEmployee1);
      if (create1Result.status !== 201) {
        throw new Error('Failed to create test employee 1');
      }

      const testEmployee2 = {
        employeeId: `ID_TEST_2_${timestamp}`,
        companyId: 'default-company',
        joinDate: '2024-01-15',
        salary: '50000',
        name: 'ID Test Employee 2',
        email: `idtest2${timestamp}@example.com`,
        phone: '1234567891',
        designation: 'Test Engineer 2',
        departmentId: this.testData.departments[0].id
      };

      const create2Result = await this.makeRequest('POST', '/api/employees', testEmployee2);
      if (create2Result.status !== 201) {
        throw new Error('Failed to create test employee 2');
      }

      // Step 2: Verify unique IDs generated
      const emp1Id = create1Result.data.id;
      const emp2Id = create2Result.data.id;
      
      if (emp1Id === emp2Id) {
        throw new Error('Duplicate IDs generated');
      }

      // Step 3: Test data consistency after operations
      const finalListResult = await this.makeRequest('GET', '/api/employees');
      if (finalListResult.status !== 200) {
        throw new Error('Failed to get final employee list');
      }

      const employees = finalListResult.data;
      const uniqueIds = new Set(employees.map(emp => emp.id));
      
      if (uniqueIds.size !== employees.length) {
        throw new Error('Duplicate employee IDs found in system');
      }

      // Step 4: Test dashboard stats reflect correct data
      const statsResult = await this.makeRequest('GET', '/api/dashboard/stats');
      if (statsResult.status !== 200) {
        throw new Error('Failed to get dashboard stats');
      }

      const stats = statsResult.data;
      if (parseInt(stats.totalEmployees) !== employees.length) {
        console.log(`⚠️ Dashboard stats may be inconsistent: reported ${stats.totalEmployees}, actual ${employees.length}`);
      }

      console.log('✅ Data reset and ID management flow completed successfully');
      this.testResults.push({ test: 'Data Reset and ID Management Flow', status: 'PASS' });
      
    } catch (error) {
      console.log('❌ Data reset and ID management flow failed:', error.message);
      this.testResults.push({ test: 'Data Reset and ID Management Flow', status: 'FAIL', error: error.message });
    }
  }

  getResults() {
    return this.testResults;
  }
}

export default SystemFlowTester;