import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertDepartmentSchema, 
  insertLeaveApplicationSchema,
  insertMissPunchRequestSchema,
  insertAttendanceRecordSchema,
  insertFieldWorkVisitSchema,
  insertCompanySchema,
  insertLocationSchema,
  insertEsslDeviceSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// Simple password hashing function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;
      if (!sessionUser) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(sessionUser.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Save user in session
      (req as any).session.user = { id: user.id };

      // Get employee details if available
      let employee = null;
      if (user.employeeId) {
        employee = await storage.getEmployee(user.employeeId);
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          companyId: user.companyId,
          employeeId: user.employeeId,
          isActive: user.isActive,
          employee
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Company registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { companyName, companyCode, companyEmail, companyPhone, adminUsername, adminPassword, timezone } = req.body;
      
      if (!companyName || !companyCode || !adminUsername || !adminPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if company code already exists
      const existingCompany = await storage.getCompanyByCode(companyCode);
      if (existingCompany) {
        return res.status(400).json({ error: "Company code already exists" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(adminUsername);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create company
      const company = await storage.createCompany({
        name: companyName,
        code: companyCode,
        email: companyEmail,
        phone: companyPhone,
        timezone: timezone || "UTC"
      });

      // Create admin user
      const adminUser = await storage.createUser({
        username: adminUsername,
        password: hashPassword(adminPassword),
        role: "admin",
        companyId: company.id,
        isActive: true
      });

      res.status(201).json({
        message: "Company registered successfully",
        company: { id: company.id, name: company.name, code: company.code },
        user: { id: adminUser.id, username: adminUser.username, role: adminUser.role }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
      console.log("Received employee data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertEmployeeSchema.parse(req.body);
      console.log("Validated employee data:", JSON.stringify(validatedData, null, 2));
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Employee creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee", details: error.message || error });
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
  // Employee-specific leave balance route
  app.get("/api/leave-balances/:employeeId", async (req, res) => {
    try {
      const balance = await storage.getLeaveBalance(req.params.employeeId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave balance" });
    }
  });

  // Field work visits routes
  app.get("/api/field-visits/active/:employeeId", async (req, res) => {
    try {
      const visits = await storage.getActiveFieldVisits(req.params.employeeId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active visits" });
    }
  });

  app.get("/api/field-visits/completed/:employeeId", async (req, res) => {
    try {
      const visits = await storage.getCompletedFieldVisits(req.params.employeeId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch completed visits" });
    }
  });

  app.post("/api/field-visits", async (req, res) => {
    try {
      const validatedData = insertFieldWorkVisitSchema.parse(req.body);
      const visit = await storage.createFieldVisit({
        ...validatedData,
        startTime: new Date()
      });
      res.status(201).json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid visit data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create field visit" });
    }
  });

  app.put("/api/field-visits/:id/end", async (req, res) => {
    try {
      const { endLocation, endAddress } = req.body;
      const visit = await storage.endFieldVisit(req.params.id, {
        endTime: new Date(),
        endLocation,
        endAddress
      });
      res.json(visit);
    } catch (error) {
      res.status(500).json({ error: "Failed to end field visit" });
    }
  });

  // Advanced reporting routes
  app.get("/api/reports/analytics", async (req, res) => {
    try {
      const { from, to, department } = req.query;
      const analytics = await storage.getAnalytics({
        from: from as string,
        to: to as string,
        department: department as string
      });
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/reports/attendance-trends", async (req, res) => {
    try {
      const { from, to } = req.query;
      const trends = await storage.getAttendanceTrends({
        from: from as string,
        to: to as string
      });
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance trends" });
    }
  });

  app.get("/api/reports/leave-stats", async (req, res) => {
    try {
      const { from, to } = req.query;
      const stats = await storage.getLeaveStatistics({
        from: from as string,
        to: to as string
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leave statistics" });
    }
  });

  app.get("/api/reports/field-work", async (req, res) => {
    try {
      const { from, to } = req.query;
      const stats = await storage.getFieldWorkStatistics({
        from: from as string,
        to: to as string
      });
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch field work statistics" });
    }
  });

  app.get("/api/reports/export/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { from, to, department } = req.query;
      
      const csvData = await storage.exportReport(type, {
        from: from as string,
        to: to as string,
        department: department as string
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export report" });
    }
  });

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

  app.get("/api/leave-applications/employee/:employeeId", async (req, res) => {
    try {
      const leaves = await storage.getLeaveApplicationsByEmployee(req.params.employeeId);
      res.json(leaves);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee leave applications" });
    }
  });

  app.post("/api/leave-applications", async (req, res) => {
    try {
      console.log("Leave application request body:", JSON.stringify(req.body, null, 2));
      const validatedData = insertLeaveApplicationSchema.parse(req.body);
      console.log("Validated leave application data:", JSON.stringify(validatedData, null, 2));
      
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
      console.error("Leave application error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid leave application data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create leave application", details: error.message || error });
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

  // Simple HRMS - No external integrations needed

  // eSSL Integration Routes
  app.get("/api/essl/status", (req, res) => {
    res.json(esslService.getDeviceStatus());
  });

  app.post("/api/essl/sync/:deviceId", async (req, res) => {
    try {
      const success = await esslService.manualSync(req.params.deviceId);
      res.json({ success, message: success ? "Sync initiated" : "Device not connected" });
    } catch (error) {
      res.status(500).json({ error: "Failed to sync device" });
    }
  });

  // GPS Tracking Routes
  app.post("/api/gps/update-location", async (req, res) => {
    try {
      const { employeeId, latitude, longitude, accuracy, address, isFieldWork } = req.body;
      
      const result = await gpsTrackingService.updateEmployeeLocation({
        employeeId,
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy,
          timestamp: new Date()
        },
        address,
        isFieldWork
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/gps/start-fieldwork", async (req, res) => {
    try {
      const { employeeId, clientName, purpose, latitude, longitude, address } = req.body;
      
      const coordinates = latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      } : undefined;

      const fieldWork = await gpsTrackingService.startFieldWork(
        employeeId,
        clientName,
        purpose,
        coordinates,
        address
      );

      res.status(201).json(fieldWork);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/gps/end-fieldwork/:visitId", async (req, res) => {
    try {
      const { latitude, longitude, address, notes } = req.body;
      
      const coordinates = latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date()
      } : undefined;

      const fieldWork = await gpsTrackingService.endFieldWork(
        req.params.visitId,
        coordinates,
        address,
        notes
      );

      res.json(fieldWork);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/gps/location-history/:employeeId", async (req, res) => {
    try {
      const { days } = req.query;
      const history = await gpsTrackingService.getEmployeeLocationHistory(
        req.params.employeeId,
        days ? parseInt(days as string) : 7
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  app.get("/api/gps/location-report/:employeeId", async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      const report = await gpsTrackingService.generateLocationReport(
        req.params.employeeId,
        fromDate as string,
        toDate as string
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate location report" });
    }
  });

  // AI Document Generation Routes
  app.post("/api/ai/generate-document", async (req, res) => {
    try {
      const document = await aiDocumentGenerator.generateDocument(req.body);
      res.json(document);
    } catch (error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please provide your OpenAI API key to use AI features." 
        });
      }
      res.status(500).json({ error: "Failed to generate document" });
    }
  });

  app.post("/api/ai/generate-policy", async (req, res) => {
    try {
      const { policyType, companyId, customRequirements } = req.body;
      const document = await aiDocumentGenerator.generatePolicyFromTemplate(
        policyType,
        companyId,
        customRequirements
      );
      res.json(document);
    } catch (error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please provide your OpenAI API key to use AI features." 
        });
      }
      res.status(500).json({ error: "Failed to generate policy document" });
    }
  });

  app.post("/api/ai/generate-offer-letter", async (req, res) => {
    try {
      const { employeeId, position, salary, startDate, benefits } = req.body;
      const document = await aiDocumentGenerator.generateOfferLetter(
        employeeId,
        position,
        parseFloat(salary),
        startDate,
        benefits
      );
      res.json(document);
    } catch (error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please provide your OpenAI API key to use AI features." 
        });
      }
      res.status(500).json({ error: "Failed to generate offer letter" });
    }
  });

  app.post("/api/ai/generate-performance-review", async (req, res) => {
    try {
      const { employeeId, reviewPeriod, achievements, improvements } = req.body;
      const document = await aiDocumentGenerator.generatePerformanceReview(
        employeeId,
        reviewPeriod,
        achievements,
        improvements
      );
      res.json(document);
    } catch (error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please provide your OpenAI API key to use AI features." 
        });
      }
      res.status(500).json({ error: "Failed to generate performance review" });
    }
  });

  app.post("/api/ai/batch-generate", async (req, res) => {
    try {
      const { requests } = req.body;
      const documents = await aiDocumentGenerator.batchGenerateDocuments(requests);
      res.json(documents);
    } catch (error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please provide your OpenAI API key to use AI features." 
        });
      }
      res.status(500).json({ error: "Failed to generate documents" });
    }
  });

  // Mobile API Routes - Token-based authentication for mobile apps
  const mobileTokens = new Map<string, { userId: string, expires: number, employeeId?: string }>();

  function generateMobileToken(userId: string, employeeId?: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    mobileTokens.set(token, { userId, expires, employeeId });
    return token;
  }

  function verifyMobileToken(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const tokenData = mobileTokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      mobileTokens.delete(token);
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    req.user = { id: tokenData.userId, employeeId: tokenData.employeeId };
    next();
  }

  // Mobile Authentication
  app.post("/api/mobile/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      const token = generateMobileToken(user.id, user.employeeId || undefined);
      await storage.updateUserLastLogin(user.id);

      let employee = null;
      if (user.employeeId) {
        employee = await storage.getEmployee(user.employeeId);
      }

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          companyId: user.companyId,
          employeeId: user.employeeId,
          employee
        }
      });
    } catch (error) {
      console.error('Mobile login error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mobile Dashboard
  app.get("/api/mobile/dashboard", verifyMobileToken, async (req, res) => {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID required" });
      }

      const today = new Date().toISOString().split('T')[0];
      const leaveBalance = await storage.getLeaveBalance(employeeId);
      const recentLeaves = await storage.getLeaveApplicationsByEmployee(employeeId);

      res.json({
        date: today,
        leaveBalance: leaveBalance || { 
          employeeId, 
          annualLeaves: 21, 
          sickLeaves: 10, 
          casualLeaves: 7, 
          usedAnnual: 0, 
          usedSick: 0, 
          usedCasual: 0 
        },
        recentLeaves: recentLeaves.slice(0, 5),
        message: "Mobile dashboard loaded successfully"
      });
    } catch (error) {
      console.error('Mobile dashboard error:', error);
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  // Mobile Attendance Punch
  app.post("/api/mobile/attendance/punch", verifyMobileToken, async (req, res) => {
    try {
      const { type, location, address } = req.body;
      const employeeId = req.user.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID required" });
      }

      if (!type || !['in', 'out'].includes(type)) {
        return res.status(400).json({ error: "Valid punch type required (in/out)" });
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      if (type === 'in') {
        const newAttendance = await storage.createAttendanceRecord({
          employeeId,
          date: today,
          punchIn: now,
          location: location || null,
          address: address || null,
          status: "present"
        });
        res.json({ message: "Punched in successfully", attendance: newAttendance });
      } else {
        res.json({ message: "Punch out functionality ready", type: "out" });
      }
    } catch (error) {
      console.error('Mobile punch error:', error);
      res.status(500).json({ error: "Failed to record punch" });
    }
  });

  // Mobile Leave Application
  app.post("/api/mobile/leave/apply", verifyMobileToken, async (req, res) => {
    try {
      const { leaveType, fromDate, toDate, reason } = req.body;
      const employeeId = req.user.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID required" });
      }

      const leaveApplication = await storage.createLeaveApplication({
        employeeId,
        leaveType,
        fromDate,
        toDate,
        reason,
        appliedDate: new Date().toISOString().split('T')[0],
        status: "pending"
      });

      res.json({ 
        message: "Leave application submitted successfully", 
        application: leaveApplication 
      });
    } catch (error) {
      console.error('Mobile leave application error:', error);
      res.status(500).json({ error: "Failed to submit leave application" });
    }
  });

  // Mobile Leave Balance
  app.get("/api/mobile/leave/balance", verifyMobileToken, async (req, res) => {
    try {
      const employeeId = req.user.employeeId;
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID required" });
      }

      const leaveBalance = await storage.getLeaveBalance(employeeId);
      res.json(leaveBalance || { 
        employeeId, 
        annualLeaves: 21, 
        sickLeaves: 10, 
        casualLeaves: 7, 
        usedAnnual: 0, 
        usedSick: 0, 
        usedCasual: 0 
      });
    } catch (error) {
      console.error('Mobile leave balance error:', error);
      res.status(500).json({ error: "Failed to get leave balance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
