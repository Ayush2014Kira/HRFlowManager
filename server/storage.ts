import { 
  employees, 
  departments, 
  leaveBalances, 
  leaveApplications, 
  attendanceRecords, 
  missPunchRequests, 
  approvals, 
  payrollRecords,
  fieldWorkVisits,
  companies,
  locations,
  esslDevices,
  users,
  userSessions,
  type Employee, 
  type Department, 
  type LeaveBalance, 
  type LeaveApplication, 
  type AttendanceRecord, 
  type MissPunchRequest, 
  type Approval, 
  type PayrollRecord,
  type User,
  type UserSession,
  type InsertEmployee, 
  type InsertDepartment, 
  type InsertLeaveBalance, 
  type InsertLeaveApplication, 
  type InsertAttendanceRecord, 
  type InsertMissPunchRequest, 
  type InsertApproval, 
  type InsertPayrollRecord,
  type InsertUser,
  type InsertUserSession,
  type FieldWorkVisit,
  type InsertFieldWorkVisit,
  type Company,
  type InsertCompany,
  type Location,
  type InsertLocation,
  type EsslDevice,
  type InsertEsslDevice
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count, or, isNotNull, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  
  // Session methods
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(id: string): Promise<UserSession | undefined>;
  deleteSession(id: string): Promise<void>;

  // Employee methods
  getEmployees(): Promise<(Employee & { department: Department })[]>;
  getEmployee(id: string): Promise<(Employee & { department: Department }) | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;

  // Department methods
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Leave Balance methods
  getLeaveBalance(employeeId: string, year: number): Promise<LeaveBalance | undefined>;
  createLeaveBalance(leaveBalance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(employeeId: string, year: number, updates: Partial<InsertLeaveBalance>): Promise<LeaveBalance>;

  // Leave Application methods
  getLeaveApplications(): Promise<(LeaveApplication & { employee: Employee })[]>;
  getLeaveApplicationsByEmployee(employeeId: string): Promise<LeaveApplication[]>;
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: string, updates: Partial<LeaveApplication>): Promise<LeaveApplication>;

  // Attendance methods
  getAttendanceRecords(employeeId?: string, date?: string): Promise<(AttendanceRecord & { employee: Employee })[]>;
  getTodayAttendance(): Promise<(AttendanceRecord & { employee: Employee })[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  punchIn(employeeId: string): Promise<AttendanceRecord>;
  punchOut(employeeId: string): Promise<AttendanceRecord>;

  // Miss Punch methods
  getMissPunchRequests(): Promise<(MissPunchRequest & { employee: Employee })[]>;
  createMissPunchRequest(request: InsertMissPunchRequest): Promise<MissPunchRequest>;
  updateMissPunchRequest(id: string, updates: Partial<MissPunchRequest>): Promise<MissPunchRequest>;

  // Approval methods
  getApprovals(): Promise<(Approval & { employee: Employee; approver: Employee })[]>;
  getPendingApprovals(): Promise<(Approval & { employee: Employee; approver: Employee })[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: string, updates: Partial<Approval>): Promise<Approval>;

  // Payroll methods
  getPayrollRecords(employeeId?: string): Promise<(PayrollRecord & { employee: Employee })[]>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    attendanceRate: number;
  }>;

  // Field work operations
  createFieldVisit(data: InsertFieldWorkVisit): Promise<FieldWorkVisit>;
  getActiveFieldVisits(employeeId: string): Promise<FieldWorkVisit[]>;
  getCompletedFieldVisits(employeeId: string): Promise<FieldWorkVisit[]>;
  endFieldVisit(id: string, updates: { endTime: Date; endLocation?: string; endAddress?: string }): Promise<FieldWorkVisit>;

  // Analytics and reporting
  getAnalytics(params: { from?: string; to?: string; department?: string }): Promise<any>;
  getAttendanceTrends(params: { from?: string; to?: string }): Promise<any>;
  getLeaveStatistics(params: { from?: string; to?: string }): Promise<any>;
  getFieldWorkStatistics(params: { from?: string; to?: string }): Promise<any>;
  exportReport(type: string, params: { from?: string; to?: string; department?: string }): Promise<string>;

  // Company management
  createCompany(data: InsertCompany): Promise<Company>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;

  // Location management
  createLocation(data: InsertLocation): Promise<Location>;
  getLocationsByCompany(companyId: string): Promise<Location[]>;

  // eSSL Device management
  createEsslDevice(data: InsertEsslDevice): Promise<EsslDevice>;
  getEsslDevices(): Promise<EsslDevice[]>;
  syncEsslDevice(deviceId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Session methods
  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(id: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, id));
    return session || undefined;
  }

  async deleteSession(id: string): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.id, id));
  }

  // Employee methods
  async getEmployees(): Promise<(Employee & { department: Department })[]> {
    return await db.select().from(employees)
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(employees.isActive, true))
      .then(rows => rows.map(row => ({ ...row.employees, department: row.departments })));
  }

  async getEmployee(id: string): Promise<(Employee & { department: Department }) | undefined> {
    const [result] = await db.select().from(employees)
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(eq(employees.id, id), eq(employees.isActive, true)));
    
    return result ? { ...result.employees, department: result.departments } : undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    
    // Create initial leave balance for current year
    const currentYear = new Date().getFullYear();
    await this.createLeaveBalance({
      employeeId: newEmployee.id,
      year: currentYear,
      annualLeave: 21,
      sickLeave: 12,
      casualLeave: 12,
      lwpDays: 0
    });

    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updated] = await db.update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  // Leave Balance methods
  async getLeaveBalance(employeeId: string, year: number): Promise<LeaveBalance | undefined> {
    const [balance] = await db.select().from(leaveBalances)
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
    return balance || undefined;
  }

  async createLeaveBalance(leaveBalance: InsertLeaveBalance): Promise<LeaveBalance> {
    const [newBalance] = await db.insert(leaveBalances).values(leaveBalance).returning();
    return newBalance;
  }

  async updateLeaveBalance(employeeId: string, year: number, updates: Partial<InsertLeaveBalance>): Promise<LeaveBalance> {
    const [updated] = await db.update(leaveBalances)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)))
      .returning();
    return updated;
  }

  // Leave Application methods
  async getLeaveApplications(): Promise<(LeaveApplication & { employee: Employee })[]> {
    return await db.select().from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .orderBy(desc(leaveApplications.appliedAt))
      .then(rows => rows.map(row => ({ ...row.leave_applications, employee: row.employees })));
  }

  async getLeaveApplicationsByEmployee(employeeId: string): Promise<LeaveApplication[]> {
    return await db.select().from(leaveApplications)
      .where(eq(leaveApplications.employeeId, employeeId))
      .orderBy(desc(leaveApplications.appliedAt));
  }

  async createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const [newApplication] = await db.insert(leaveApplications).values(leaveApplication).returning();
    
    // Create approval record for manager
    await this.createApproval({
      employeeId: leaveApplication.employeeId,
      approverId: leaveApplication.employeeId, // This should be set to manager's ID in real implementation
      type: 'leave',
      referenceId: newApplication.id,
      level: 1
    });

    return newApplication;
  }

  async updateLeaveApplication(id: string, updates: Partial<LeaveApplication>): Promise<LeaveApplication> {
    const [updated] = await db.update(leaveApplications)
      .set(updates)
      .where(eq(leaveApplications.id, id))
      .returning();
    return updated;
  }

  // Attendance methods
  async getAttendanceRecords(employeeId?: string, date?: string): Promise<(AttendanceRecord & { employee: Employee })[]> {
    let whereConditions = [];
    
    if (employeeId) {
      whereConditions.push(eq(attendanceRecords.employeeId, employeeId));
    }
    
    if (date) {
      whereConditions.push(eq(attendanceRecords.date, date));
    }

    let query = db.select().from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id));
    
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    return await query.then(rows => rows.map(row => ({ ...row.attendance_records, employee: row.employees })));
  }

  async getTodayAttendance(): Promise<(AttendanceRecord & { employee: Employee })[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getAttendanceRecords(undefined, today);
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const [updated] = await db.update(attendanceRecords)
      .set(updates)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated;
  }

  async punchIn(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if already punched in today
    const [existing] = await db.select().from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, employeeId), eq(attendanceRecords.date, today)));

    if (existing && existing.punchIn && !existing.punchOut) {
      throw new Error('Already punched in today. Please punch out first.');
    }

    if (existing) {
      // If already completed a full day (punched in and out), create a new entry for next shift
      if (existing.punchIn && existing.punchOut) {
        return await this.createAttendanceRecord({
          employeeId,
          date: today,
          punchIn: now,
          status: 'present'
        });
      }
      // Update existing record
      return await this.updateAttendanceRecord(existing.id, {
        punchIn: now,
        status: 'present'
      });
    } else {
      // Create new record
      return await this.createAttendanceRecord({
        employeeId,
        date: today,
        punchIn: now,
        status: 'present'
      });
    }
  }

  async punchOut(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Get the most recent attendance record for today that has punch-in but no punch-out
    const [existing] = await db.select().from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.employeeId, employeeId), 
        eq(attendanceRecords.date, today),
        isNotNull(attendanceRecords.punchIn),
        isNull(attendanceRecords.punchOut)
      ))
      .orderBy(desc(attendanceRecords.punchIn));

    if (!existing) {
      throw new Error('Must punch in first or already punched out');
    }

    // Calculate working hours
    const punchInTime = new Date(existing.punchIn!);
    const workingMs = now.getTime() - punchInTime.getTime();
    const workingHours = Number((workingMs / (1000 * 60 * 60)).toFixed(2));
    const overtimeHours = Math.max(0, workingHours - 8);

    return await this.updateAttendanceRecord(existing.id, {
      punchOut: now,
      workingHours: workingHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2)
    });
  }

  // Miss Punch methods
  async getMissPunchRequests(): Promise<(MissPunchRequest & { employee: Employee })[]> {
    return await db.select().from(missPunchRequests)
      .innerJoin(employees, eq(missPunchRequests.employeeId, employees.id))
      .orderBy(desc(missPunchRequests.createdAt))
      .then(rows => rows.map(row => ({ ...row.miss_punch_requests, employee: row.employees })));
  }

  async createMissPunchRequest(request: InsertMissPunchRequest): Promise<MissPunchRequest> {
    const [newRequest] = await db.insert(missPunchRequests).values(request).returning();
    
    // Create approval record
    await this.createApproval({
      employeeId: request.employeeId,
      approverId: request.employeeId, // This should be set to manager's ID in real implementation
      type: 'miss_punch',
      referenceId: newRequest.id,
      level: 1
    });

    return newRequest;
  }

  async updateMissPunchRequest(id: string, updates: Partial<MissPunchRequest>): Promise<MissPunchRequest> {
    const [updated] = await db.update(missPunchRequests)
      .set(updates)
      .where(eq(missPunchRequests.id, id))
      .returning();
    return updated;
  }

  // Approval methods
  async getApprovals(): Promise<(Approval & { employee: Employee; approver: Employee })[]> {
    return await db.select().from(approvals)
      .innerJoin(employees, eq(approvals.employeeId, employees.id))
      .innerJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(desc(approvals.createdAt))
      .then(rows => rows.map(row => ({ 
        ...row.approvals, 
        employee: row.employees,
        approver: row.employees // This should be properly joined with approver in real implementation
      })));
  }

  async getPendingApprovals(): Promise<(Approval & { employee: Employee; approver: Employee })[]> {
    return await db.select().from(approvals)
      .innerJoin(employees, eq(approvals.employeeId, employees.id))
      .where(eq(approvals.status, 'pending'))
      .orderBy(desc(approvals.createdAt))
      .then(rows => rows.map(row => ({ 
        ...row.approvals, 
        employee: row.employees,
        approver: row.employees // This should be properly joined with approver in real implementation
      })));
  }

  async createApproval(approval: InsertApproval): Promise<Approval> {
    const [newApproval] = await db.insert(approvals).values(approval).returning();
    return newApproval;
  }

  async updateApproval(id: string, updates: Partial<Approval>): Promise<Approval> {
    const [updated] = await db.update(approvals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(approvals.id, id))
      .returning();
    return updated;
  }

  // Payroll methods
  async getPayrollRecords(employeeId?: string): Promise<(PayrollRecord & { employee: Employee })[]> {
    let query = db.select().from(payrollRecords)
      .innerJoin(employees, eq(payrollRecords.employeeId, employees.id));

    if (employeeId) {
      query = query.where(eq(payrollRecords.employeeId, employeeId));
    }

    return await query.then(rows => rows.map(row => ({ ...row.payroll_records, employee: row.employees })));
  }

  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [newRecord] = await db.insert(payrollRecords).values(record).returning();
    return newRecord;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalEmployees: number;
    presentToday: number;
    pendingLeaves: number;
    attendanceRate: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    // Total employees
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.isActive, true));
    const totalEmployees = totalResult.count;

    // Present today
    const [presentResult] = await db.select({ count: sql<number>`count(*)` })
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.date, today), eq(attendanceRecords.status, 'present')));
    const presentToday = presentResult.count;

    // Pending leaves
    const [pendingResult] = await db.select({ count: sql<number>`count(*)` })
      .from(leaveApplications)
      .where(eq(leaveApplications.status, 'pending'));
    const pendingLeaves = pendingResult.count;

    // Attendance rate
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

    return {
      totalEmployees,
      presentToday,
      pendingLeaves,
      attendanceRate: Number(attendanceRate.toFixed(1))
    };
  }

  // Field work methods
  async createFieldVisit(data: InsertFieldWorkVisit): Promise<FieldWorkVisit> {
    const [visit] = await db.insert(fieldWorkVisits).values(data).returning();
    return visit;
  }

  async getActiveFieldVisits(employeeId: string): Promise<FieldWorkVisit[]> {
    return await db.select().from(fieldWorkVisits)
      .where(and(
        eq(fieldWorkVisits.employeeId, employeeId),
        eq(fieldWorkVisits.status, 'in_progress')
      ))
      .orderBy(desc(fieldWorkVisits.startTime));
  }

  async getCompletedFieldVisits(employeeId: string): Promise<FieldWorkVisit[]> {
    return await db.select().from(fieldWorkVisits)
      .where(and(
        eq(fieldWorkVisits.employeeId, employeeId),
        eq(fieldWorkVisits.status, 'completed')
      ))
      .orderBy(desc(fieldWorkVisits.startTime))
      .limit(10);
  }

  async endFieldVisit(id: string, updates: { endTime: Date; endLocation?: string; endAddress?: string }): Promise<FieldWorkVisit> {
    const [visit] = await db.update(fieldWorkVisits)
      .set({
        ...updates,
        status: 'completed'
      })
      .where(eq(fieldWorkVisits.id, id))
      .returning();
    return visit;
  }

  // Analytics methods - returning mock data for now, implement proper analytics later
  async getAnalytics(params: { from?: string; to?: string; department?: string }): Promise<any> {
    return {
      totalEmployees: 25,
      avgAttendance: 92,
      pendingLeaves: 8,
      fieldVisits: 45,
      departmentDistribution: [
        { name: 'Engineering', value: 40 },
        { name: 'Sales', value: 30 },
        { name: 'HR', value: 20 },
        { name: 'Marketing', value: 10 }
      ]
    };
  }

  async getAttendanceTrends(params: { from?: string; to?: string }): Promise<any> {
    return [
      { month: 'Jan', attendance: 95 },
      { month: 'Feb', attendance: 92 },
      { month: 'Mar', attendance: 98 },
      { month: 'Apr', attendance: 90 },
      { month: 'May', attendance: 94 }
    ];
  }

  async getLeaveStatistics(params: { from?: string; to?: string }): Promise<any> {
    return {
      typeDistribution: [
        { name: 'Annual', count: 45 },
        { name: 'Sick', count: 32 },
        { name: 'Casual', count: 28 },
        { name: 'Emergency', count: 15 }
      ],
      monthlyTrends: [
        { month: 'Jan', applications: 12, approved: 10 },
        { month: 'Feb', applications: 15, approved: 13 },
        { month: 'Mar', applications: 18, approved: 16 }
      ]
    };
  }

  async getFieldWorkStatistics(params: { from?: string; to?: string }): Promise<any> {
    return {
      dailyVisits: [
        { date: '2024-01-01', visits: 5 },
        { date: '2024-01-02', visits: 8 },
        { date: '2024-01-03', visits: 6 }
      ],
      topFieldWorkers: [
        { id: '1', name: 'John Smith', department: 'Sales', visits: 25, distance: '150' },
        { id: '2', name: 'Sarah Johnson', department: 'Sales', visits: 22, distance: '140' }
      ]
    };
  }

  async exportReport(type: string, params: { from?: string; to?: string; department?: string }): Promise<string> {
    // Simple CSV export - implement proper data fetching later
    const headers = ['Date', 'Employee', 'Department', 'Status'];
    const rows = [
      ['2024-01-01', 'John Smith', 'Engineering', 'Present'],
      ['2024-01-01', 'Sarah Johnson', 'HR', 'Present']
    ];
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }

  // Company methods
  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.code, code));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).where(eq(companies.isActive, true));
  }

  // Location methods
  async createLocation(data: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(data).returning();
    return location;
  }

  async getLocationsByCompany(companyId: string): Promise<Location[]> {
    return await db.select().from(locations)
      .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)));
  }

  // eSSL Device methods
  async createEsslDevice(data: InsertEsslDevice): Promise<EsslDevice> {
    const [device] = await db.insert(esslDevices).values(data).returning();
    return device;
  }

  async getEsslDevices(): Promise<EsslDevice[]> {
    return await db.select().from(esslDevices).where(eq(esslDevices.isActive, true));
  }

  async syncEsslDevice(deviceId: string): Promise<any> {
    // Placeholder for eSSL device synchronization
    // In real implementation, this would connect to the eSSL device API
    await db.update(esslDevices)
      .set({ lastSync: new Date() })
      .where(eq(esslDevices.id, deviceId));
    
    return { success: true, recordsImported: 0 };
  }
}

export const storage = new DatabaseStorage();
