import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertDepartmentSchema,
  insertEmployeeSchema,
  insertLeaveApplicationSchema,
  insertAttendanceRecordSchema,
  insertMissPunchRequestSchema,
  insertApprovalSchema,
  insertPayrollRecordSchema,
} from "@shared/schema";

// Simple authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
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
        req.session.userId = user.id;
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
      const user = await storage.getUser(req.session.userId);
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
      res.json(record);
    } catch (error) {
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
      res.json(record);
    } catch (error) {
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
  const httpServer = createServer(app);
  return httpServer;
}