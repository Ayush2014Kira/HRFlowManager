import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertDepartmentSchema,
  insertEmployeeSchema,
  insertLeaveApplicationSchema,
  insertLeaveTypeSchema,
  insertEmployeeLeaveAssignmentSchema,
  insertAttendanceRecordSchema,
  insertMissPunchRequestSchema,
  insertApprovalSchema,
  insertPayrollRecordSchema,
  insertTimeEntrySchema,
  insertWorkScheduleSchema,
} from "@shared/schema";
import crypto from "crypto";

// Initialize demo users
async function initializeDemoUsers() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) return; // Already initialized

    // Hash function for passwords
    const hashPassword = (password: string) => {
      return crypto.createHash('sha256').update(password).digest('hex');
    };

    // Create demo users with only required fields
    const demoUsers = [
      {
        username: "admin",
        password: hashPassword("admin123"),
        role: "admin",
        isActive: true
      },
      {
        username: "sarah.johnson",
        password: hashPassword("sarah123"),
        role: "hr",
        isActive: true
      },
      {
        username: "john.smith",
        password: hashPassword("john123"),
        role: "employee",
        isActive: true
      }
    ];

    for (const userData of demoUsers) {
      try {
        await storage.createUser(userData);
        console.log(`Created demo user: ${userData.username}`);
      } catch (error) {
        console.log(`Demo user ${userData.username} might already exist`);
      }
    }
    // Create demo departments
    try {
      await storage.createDepartment({
        name: "Human Resources",
        code: "HR",
      });
      await storage.createDepartment({
        name: "Engineering", 
        code: "ENG",
      });
      await storage.createDepartment({
        name: "Sales",
        code: "SALES",
      });
    } catch (error) {
      console.log("Demo departments might already exist");
    }

    // Create demo leave types
    try {
      await storage.createLeaveType({
        companyId: "default-company",
        name: "Annual Leave",
        description: "Yearly vacation leave",
        maxDaysPerYear: 21,
        carryForward: true,
        carryForwardLimit: 5,
        paidLeave: true,
        isActive: true
      });
      await storage.createLeaveType({
        companyId: "default-company", 
        name: "Sick Leave",
        description: "Medical leave",
        maxDaysPerYear: 12,
        carryForward: false,
        carryForwardLimit: 0,
        paidLeave: true,
        isActive: true
      });
      await storage.createLeaveType({
        companyId: "default-company",
        name: "Casual Leave",
        description: "Personal leave",
        maxDaysPerYear: 12,
        carryForward: false,
        carryForwardLimit: 0,
        paidLeave: true,
        isActive: true
      });
    } catch (error) {
      console.log("Demo leave types might already exist");
    }

    // Call sample data creation
    await createSampleDataAfterInit();

    console.log("Demo users and data initialized successfully");
  } catch (error) {
    console.error("Error initializing demo users:", error);
  }
}

// Create sample data after initial setup
async function createSampleDataAfterInit() {
  try {
    // Import the sample data function
    const { createSampleData } = await import("./createSampleData");
    await createSampleData();
  } catch (error) {
    console.error("Error loading sample data:", error);
  }
}

// Simple authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session && (req.session as any).userId) {
    next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize demo users on startup
  await initializeDemoUsers();
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.authenticateUser(username, password);
      if (user) {
        (req.session as any).userId = user.id;
        res.json({ user: { id: user.id, username: user.username, role: user.role, companyId: user.companyId } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        res.json({ id: user.id, username: user.username, role: user.role, companyId: user.companyId });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Department routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid department data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  // Employee routes
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (employee) {
        res.json(employee);
      } else {
        res.status(404).json({ error: "Employee not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const employee = await storage.updateEmployee(req.params.id, updates);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { employeeId, date } = req.query;
      const records = await storage.getAttendanceRecords(employeeId as string, date as string);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.get("/api/attendance/today", requireAuth, async (req, res) => {
    try {
      const records = await storage.getTodayAttendance();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  app.post("/api/attendance/punch-in", requireAuth, async (req, res) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }
      
      const record = await storage.punchIn(employeeId);
      res.status(200).json(record);
    } catch (error) {
      console.error("Punch in error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to punch in" });
    }
  });

  app.post("/api/attendance/punch-out", requireAuth, async (req, res) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }
      
      const record = await storage.punchOut(employeeId);
      res.status(200).json(record);
    } catch (error) {
      console.error("Punch out error:", error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to punch out" });
    }
  });

  // Leave application routes
  app.get("/api/leave-applications", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getLeaveApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave applications" });
    }
  });

  app.post("/api/leave-applications", requireAuth, async (req, res) => {
    try {
      console.log("Leave application request body:", req.body);
      const validatedData = insertLeaveApplicationSchema.parse(req.body);
      console.log("Validated leave application data:", validatedData);
      
      // Calculate total days
      const fromDate = new Date(validatedData.fromDate);
      const toDate = new Date(validatedData.toDate);
      const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const applicationData = {
        ...validatedData,
        totalDays,
        status: "pending" as const,
        appliedAt: new Date()
      };

      const application = await storage.createLeaveApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid leave application data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create leave application" });
    }
  });

  app.put("/api/leave-applications/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const application = await storage.updateLeaveApplication(req.params.id, updates);
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to update leave application" });
    }
  });

  // Leave Type routes
  app.get("/api/leave-types", requireAuth, async (req, res) => {
    try {
      const companyId = req.query.companyId as string;
      const leaveTypes = await storage.getLeaveTypes(companyId);
      res.json(leaveTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave types" });
    }
  });

  app.get("/api/leave-types/:id", requireAuth, async (req, res) => {
    try {
      const leaveType = await storage.getLeaveType(req.params.id);
      if (leaveType) {
        res.json(leaveType);
      } else {
        res.status(404).json({ error: "Leave type not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave type" });
    }
  });

  app.post("/api/leave-types", requireAuth, async (req, res) => {
    try {
      const validatedData = insertLeaveTypeSchema.parse(req.body);
      const leaveType = await storage.createLeaveType(validatedData);
      res.status(201).json(leaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid leave type data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create leave type" });
    }
  });

  app.put("/api/leave-types/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const leaveType = await storage.updateLeaveType(req.params.id, updates);
      res.json(leaveType);
    } catch (error) {
      res.status(500).json({ error: "Failed to update leave type" });
    }
  });

  app.delete("/api/leave-types/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLeaveType(req.params.id);
      res.json({ message: "Leave type deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete leave type" });
    }
  });

  // Employee Leave Assignment routes
  app.get("/api/employee-leave-assignments", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const assignments = await storage.getEmployeeLeaveAssignments(employeeId, year);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee leave assignments" });
    }
  });

  app.get("/api/employees/:employeeId/leave-assignments", requireAuth, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const assignments = await storage.getEmployeeLeaveAssignments(employeeId, year);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee leave assignments" });
    }
  });

  app.post("/api/employee-leave-assignments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmployeeLeaveAssignmentSchema.parse(req.body);
      const assignment = await storage.createEmployeeLeaveAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid assignment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee leave assignment" });
    }
  });

  app.post("/api/employee-leave-assignments/bulk", requireAuth, async (req, res) => {
    try {
      const bulkAssignmentSchema = z.object({
        employeeIds: z.array(z.string()).min(1, "At least one employee is required"),
        leaveTypeId: z.string().min(1, "Leave type is required"),
        allocatedDays: z.number().min(0, "Must be 0 or more"),
        year: z.number().min(2020).max(2030),
      });

      const validatedData = bulkAssignmentSchema.parse(req.body);
      const assignments = await storage.createBulkEmployeeLeaveAssignments(validatedData);
      res.status(201).json(assignments);
    } catch (error) {
      console.error("Error creating bulk leave assignments:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create bulk leave assignments" });
      }
    }
  });

  app.put("/api/employee-leave-assignments/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const assignment = await storage.updateEmployeeLeaveAssignment(req.params.id, updates);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update employee leave assignment" });
    }
  });

  app.delete("/api/employee-leave-assignments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEmployeeLeaveAssignment(req.params.id);
      res.json({ message: "Employee leave assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee leave assignment" });
    }
  });

  // Time Tracking routes
  app.get("/api/time-entries", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const date = req.query.date as string;
      const entries = await storage.getTimeEntries(employeeId, date);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", requireAuth, async (req, res) => {
    try {
      // Convert string dates to Date objects
      const data = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      const validatedData = insertTimeEntrySchema.parse(data);
      const entry = await storage.createTimeEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create time entry" });
      }
    }
  });

  app.post("/api/time-entries/start", requireAuth, async (req, res) => {
    try {
      const { employeeId, ...data } = req.body;
      const activeEntry = await storage.getActiveTimeEntry(employeeId);
      
      if (activeEntry) {
        return res.status(400).json({ error: "Employee already has an active time entry" });
      }
      
      const entry = await storage.startTimeEntry(employeeId, data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error starting time entry:", error);
      res.status(500).json({ error: "Failed to start time entry" });
    }
  });

  app.put("/api/time-entries/:id/stop", requireAuth, async (req, res) => {
    try {
      const entry = await storage.stopTimeEntry(req.params.id);
      res.json(entry);
    } catch (error) {
      console.error("Error stopping time entry:", error);
      res.status(500).json({ error: "Failed to stop time entry" });
    }
  });

  app.put("/api/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const entry = await storage.updateTimeEntry(req.params.id, updates);
      res.json(entry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTimeEntry(req.params.id);
      res.json({ message: "Time entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting time entry:", error);
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  app.get("/api/time-entries/active/:employeeId", requireAuth, async (req, res) => {
    try {
      const entry = await storage.getActiveTimeEntry(req.params.employeeId);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching active time entry:", error);
      res.status(500).json({ error: "Failed to fetch active time entry" });
    }
  });

  app.get("/api/work-schedules", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const schedules = await storage.getWorkSchedules(employeeId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching work schedules:", error);
      res.status(500).json({ error: "Failed to fetch work schedules" });
    }
  });

  app.post("/api/work-schedules", requireAuth, async (req, res) => {
    try {
      const validatedData = insertWorkScheduleSchema.parse(req.body);
      const schedule = await storage.createWorkSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating work schedule:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create work schedule" });
      }
    }
  });

  app.put("/api/work-schedules/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const schedule = await storage.updateWorkSchedule(req.params.id, updates);
      res.json(schedule);
    } catch (error) {
      console.error("Error updating work schedule:", error);
      res.status(500).json({ error: "Failed to update work schedule" });
    }
  });

  app.delete("/api/work-schedules/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkSchedule(req.params.id);
      res.json({ message: "Work schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting work schedule:", error);
      res.status(500).json({ error: "Failed to delete work schedule" });
    }
  });

  // Miss punch request routes
  app.get("/api/miss-punch-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getMissPunchRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miss punch requests" });
    }
  });

  app.post("/api/miss-punch-requests", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMissPunchRequestSchema.parse(req.body);
      const request = await storage.createMissPunchRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid miss punch request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create miss punch request" });
    }
  });

  // Approval routes
  app.get("/api/approvals", requireAuth, async (req, res) => {
    try {
      const approvals = await storage.getApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/pending", requireAuth, async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  app.put("/api/approvals/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const approval = await storage.updateApproval(req.params.id, updates);
      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to update approval" });
    }
  });

  // Leave balance routes
  app.get("/api/leave-balance/:employeeId/:year", requireAuth, async (req, res) => {
    try {
      const { employeeId, year } = req.params;
      const balance = await storage.getLeaveBalance(employeeId, parseInt(year));
      if (!balance) {
        return res.status(404).json({ error: "Leave balance not found" });
      }
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave balance" });
    }
  });

  // Payroll routes
  app.get("/api/payroll", requireAuth, async (req, res) => {
    try {
      const { employeeId } = req.query;
      const records = await storage.getPayrollRecords(employeeId as string | undefined);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payroll records" });
    }
  });

  // Create HTTP server
  // Admin password reset functionality
  app.put("/api/admin/reset-password/:userId", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser((req.session as any).userId);
      
      // Check if current user is admin
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can reset passwords" });
      }

      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Hash the new password
      const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
      
      const updatedUser = await storage.updateUser(userId, { 
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });

      res.json({ 
        success: true, 
        message: "Password reset successfully",
        userId: updatedUser.id 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Get all users (admin only)
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser((req.session as any).userId);
      
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can view all users" });
      }

      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}