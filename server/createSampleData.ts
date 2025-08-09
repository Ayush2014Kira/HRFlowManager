import { storage } from "./storage";
import crypto from "crypto";

export async function createSampleData() {
  try {
    console.log("Creating sample data...");
    
    // Get demo users and departments
    const departments = await storage.getDepartments();
    const hrDept = departments.find(d => d.code === "HR");
    const engDept = departments.find(d => d.code === "ENG");
    const salesDept = departments.find(d => d.code === "SALES");
    
    if (!hrDept || !engDept || !salesDept) {
      console.log("Departments not found, skipping employee creation");
      return;
    }

    // Create sample employees
    const sampleEmployees = [
      {
        companyId: "default-company",
        locationId: null,
        employeeId: "EMP001",
        esslEmployeeId: null,
        name: "Alice Johnson",
        email: "alice.johnson@company.com",
        phone: "+1-555-0101",
        designation: "HR Manager",
        departmentId: hrDept.id,
        joinDate: new Date("2023-01-15"),
        salary: 75000,
        pfNumber: "PF001",
        isActive: true
      },
      {
        companyId: "default-company",
        locationId: null,
        employeeId: "EMP002", 
        esslEmployeeId: null,
        name: "Bob Smith",
        email: "bob.smith@company.com",
        phone: "+1-555-0102",
        designation: "Senior Developer",
        departmentId: engDept.id,
        joinDate: new Date("2022-06-01"),
        salary: 85000,
        pfNumber: "PF002",
        isActive: true
      },
      {
        companyId: "default-company",
        locationId: null,
        employeeId: "EMP003",
        esslEmployeeId: null,
        name: "Carol Davis",
        email: "carol.davis@company.com", 
        phone: "+1-555-0103",
        designation: "Sales Executive",
        departmentId: salesDept.id,
        joinDate: new Date("2023-03-10"),
        salary: 65000,
        pfNumber: "PF003",
        isActive: true
      }
    ];

    const createdEmployees = [];
    for (const empData of sampleEmployees) {
      try {
        const existing = await storage.getEmployees();
        const alreadyExists = existing.find(e => e.employeeId === empData.employeeId);
        if (!alreadyExists) {
          const employee = await storage.createEmployee(empData);
          createdEmployees.push(employee);
          console.log(`Created employee: ${employee.name}`);
        }
      } catch (error) {
        console.log(`Employee ${empData.name} might already exist`);
      }
    }

    // Create sample attendance records
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const employee of createdEmployees) {
      try {
        // Today's attendance
        await storage.createAttendanceRecord({
          employeeId: employee.id,
          date: today.toISOString().split('T')[0],
          timeIn: "09:00",
          timeOut: null,
          status: "present",
          workingHours: 0,
          overtime: 0
        });

        // Yesterday's attendance
        await storage.createAttendanceRecord({
          employeeId: employee.id,
          date: yesterday.toISOString().split('T')[0],
          timeIn: "09:15",
          timeOut: "18:30",
          status: "present", 
          workingHours: 8.25,
          overtime: 0.25
        });

        console.log(`Created attendance records for: ${employee.name}`);
      } catch (error) {
        console.log(`Attendance records for ${employee.name} might already exist`);
      }
    }

    // Create sample leave applications
    const leaveTypes = await storage.getLeaveTypes();
    const annualLeave = leaveTypes.find(lt => lt.name === "Annual Leave");
    const sickLeave = leaveTypes.find(lt => lt.name === "Sick Leave");

    if (annualLeave && sickLeave && createdEmployees.length > 0) {
      try {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() + 7); // Next week
        const toDate = new Date(fromDate);
        toDate.setDate(toDate.getDate() + 2); // 3 days leave

        await storage.createLeaveApplication({
          employeeId: createdEmployees[0].id,
          leaveTypeId: annualLeave.id,
          fromDate: fromDate.toISOString().split('T')[0],
          toDate: toDate.toISOString().split('T')[0],
          totalDays: 3,
          reason: "Family vacation",
          status: "pending",
          appliedAt: new Date(),
          comments: "Planning a short family trip"
        });

        console.log("Created sample leave application");
      } catch (error) {
        console.log("Sample leave application might already exist");
      }
    }

    // Create sample time entries
    for (const employee of createdEmployees) {
      try {
        await storage.createTimeEntry({
          employeeId: employee.id,
          projectName: "HRMS Development",
          taskDescription: "Frontend UI development",
          startTime: new Date(today.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
          endTime: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          totalHours: 2,
          isActive: false
        });

        console.log(`Created time entry for: ${employee.name}`);
      } catch (error) {
        console.log(`Time entry for ${employee.name} might already exist`);
      }
    }

    console.log("Sample data creation completed!");
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}