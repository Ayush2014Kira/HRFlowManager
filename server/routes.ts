import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertDepartmentSchema, 
  insertLeaveApplicationSchema,
  insertMissPunchRequestSchema,
  insertAttendanceRecordSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Employees routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
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

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const updates = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, updates);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  // Departments routes
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", async (req, res) => {
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

  // Leave applications routes
  app.get("/api/leave-applications", async (req, res) => {
    try {
      const { employeeId } = req.query;
      let applications;
      
      if (employeeId) {
        applications = await storage.getLeaveApplicationsByEmployee(employeeId as string);
      } else {
        applications = await storage.getLeaveApplications();
      }
      
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave applications" });
    }
  });

  app.post("/api/leave-applications", async (req, res) => {
    try {
      const validatedData = insertLeaveApplicationSchema.parse(req.body);
      
      // Calculate total days
      const fromDate = new Date(validatedData.fromDate);
      const toDate = new Date(validatedData.toDate);
      const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const applicationData = {
        ...validatedData,
        totalDays
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

  app.put("/api/leave-applications/:id", async (req, res) => {
    try {
      const updates = req.body;
      const application = await storage.updateLeaveApplication(req.params.id, updates);
      res.json(application);
    } catch (error) {
      res.status(500).json({ error: "Failed to update leave application" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const { employeeId, date } = req.query;
      const records = await storage.getAttendanceRecords(
        employeeId as string | undefined,
        date as string | undefined
      );
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.get("/api/attendance/today", async (req, res) => {
    try {
      const records = await storage.getTodayAttendance();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's attendance" });
    }
  });

  app.post("/api/attendance/punch-in", async (req, res) => {
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

  app.post("/api/attendance/punch-out", async (req, res) => {
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

  // Miss punch requests routes
  app.get("/api/miss-punch-requests", async (req, res) => {
    try {
      const requests = await storage.getMissPunchRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch miss punch requests" });
    }
  });

  app.post("/api/miss-punch-requests", async (req, res) => {
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

  app.put("/api/miss-punch-requests/:id", async (req, res) => {
    try {
      const updates = req.body;
      const request = await storage.updateMissPunchRequest(req.params.id, updates);
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update miss punch request" });
    }
  });

  // Approvals routes
  app.get("/api/approvals", async (req, res) => {
    try {
      const approvals = await storage.getApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/pending", async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  app.put("/api/approvals/:id", async (req, res) => {
    try {
      const updates = req.body;
      const approval = await storage.updateApproval(req.params.id, updates);
      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to update approval" });
    }
  });

  // Leave balance routes
  app.get("/api/leave-balance/:employeeId/:year", async (req, res) => {
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
  app.get("/api/payroll", async (req, res) => {
    try {
      const { employeeId } = req.query;
      const records = await storage.getPayrollRecords(employeeId as string | undefined);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payroll records" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
