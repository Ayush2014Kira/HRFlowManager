import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'casual', 'emergency']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'on_leave']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);
export const approvalTypeEnum = pgEnum('approval_type', ['leave', 'miss_punch', 'overtime']);

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("employee"), // admin, hr, manager, employee
  employeeId: varchar("employee_id"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User sessions for authentication
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  designation: text("designation").notNull(),
  departmentId: varchar("department_id").notNull(),
  joinDate: date("join_date").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  pfNumber: text("pf_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave balances table
export const leaveBalances = pgTable("leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  annualLeave: integer("annual_leave").notNull().default(21),
  sickLeave: integer("sick_leave").notNull().default(12),
  casualLeave: integer("casual_leave").notNull().default(12),
  lwpDays: integer("lwp_days").notNull().default(0),
  year: integer("year").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave applications table
export const leaveApplications = pgTable("leave_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  fromDate: date("from_date").notNull(),
  toDate: date("to_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason").notNull(),
  status: leaveStatusEnum("status").notNull().default('pending'),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  punchIn: timestamp("punch_in"),
  punchOut: timestamp("punch_out"),
  workingHours: decimal("working_hours", { precision: 4, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }),
  status: attendanceStatusEnum("status").notNull().default('absent'),
  punchInLocation: text("punch_in_location"), // GPS coordinates for punch in
  punchOutLocation: text("punch_out_location"), // GPS coordinates for punch out
  punchInAddress: text("punch_in_address"), // Readable address
  punchOutAddress: text("punch_out_address"), // Readable address
  isFieldWork: boolean("is_field_work").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Field work visits table for GPS tracking
export const fieldWorkVisits = pgTable("field_work_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  clientName: text("client_name").notNull(),
  purpose: text("purpose").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startLocation: text("start_location"), // GPS coordinates
  endLocation: text("end_location"), // GPS coordinates
  startAddress: text("start_address"), // Readable address
  endAddress: text("end_address"), // Readable address
  distance: decimal("distance", { precision: 10, scale: 2 }), // in kilometers
  status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Miss punch requests table
export const missPunchRequests = pgTable("miss_punch_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  punchType: text("punch_type").notNull(), // 'in' or 'out'
  requestedTime: timestamp("requested_time").notNull(),
  reason: text("reason").notNull(),
  status: approvalStatusEnum("status").notNull().default('pending'),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Approvals table
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  approverId: varchar("approver_id").notNull(),
  type: approvalTypeEnum("type").notNull(),
  referenceId: varchar("reference_id").notNull(), // ID of the leave/miss punch request
  status: approvalStatusEnum("status").notNull().default('pending'),
  level: integer("level").notNull().default(1), // 1: Manager, 2: HR, 3: Department Head
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payroll records table
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  workingDays: integer("working_days").notNull(),
  presentDays: integer("present_days").notNull(),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }).notNull().default('0'),
  overtimeAmount: decimal("overtime_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  pfDeduction: decimal("pf_deduction", { precision: 10, scale: 2 }).notNull().default('0'),
  lwpDeduction: decimal("lwp_deduction", { precision: 10, scale: 2 }).notNull().default('0'),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  user: one(users, {
    fields: [employees.id],
    references: [users.employeeId],
  }),
  leaveBalances: many(leaveBalances),
  leaveApplications: many(leaveApplications),
  attendanceRecords: many(attendanceRecords),
  missPunchRequests: many(missPunchRequests),
  approvals: many(approvals),
  payrollRecords: many(payrollRecords),
}));

export const leaveBalancesRelations = relations(leaveBalances, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
}));

export const leaveApplicationsRelations = relations(leaveApplications, ({ one }) => ({
  employee: one(employees, {
    fields: [leaveApplications.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

export const missPunchRequestsRelations = relations(missPunchRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [missPunchRequests.employeeId],
    references: [employees.id],
  }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  employee: one(employees, {
    fields: [approvals.employeeId],
    references: [employees.id],
  }),
  approver: one(employees, {
    fields: [approvals.approverId],
    references: [employees.id],
  }),
}));

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [payrollRecords.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({
  id: true,
  updatedAt: true,
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).omit({
  id: true,
  appliedAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertMissPunchRequestSchema = createInsertSchema(missPunchRequests).omit({
  id: true,
  createdAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({
  id: true,
  createdAt: true,
});

export const insertFieldWorkVisitSchema = createInsertSchema(fieldWorkVisits).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;

export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplications.$inferSelect;

export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export type InsertMissPunchRequest = z.infer<typeof insertMissPunchRequestSchema>;
export type MissPunchRequest = typeof missPunchRequests.$inferSelect;

export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvals.$inferSelect;

export type InsertFieldWorkVisit = z.infer<typeof insertFieldWorkVisitSchema>;
export type FieldWorkVisit = typeof fieldWorkVisits.$inferSelect;

export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type PayrollRecord = typeof payrollRecords.$inferSelect;
