import { db } from "./db";
import { departments, employees, leaveBalances, leaveApplications, attendanceRecords, approvals, users, companies } from "@shared/schema";
import crypto from "crypto";

// Simple password hashing function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create default company first
    const [defaultCompany] = await db
      .insert(companies)
      .values({
        id: "default-company",
        name: "Default Company",
        code: "DEFAULT",
        address: "Default Address",
        phone: "1234567890",
        email: "admin@defaultcompany.com",
      })
      .onConflictDoNothing()
      .returning();

    // Create departments
    const dept1 = await db.insert(departments).values({
      name: "Engineering",
      code: "ENG"
    }).returning();

    const dept2 = await db.insert(departments).values({
      name: "Human Resources",
      code: "HR"
    }).returning();

    const dept3 = await db.insert(departments).values({
      name: "Marketing",
      code: "MKT"
    }).returning();

    // Create employees
    const emp1 = await db.insert(employees).values({
      companyId: "default-company",
      employeeId: "EMP001",
      name: "John Smith",
      email: "john.smith@company.com",
      phone: "+1-555-0101",
      designation: "Senior Software Engineer",
      departmentId: dept1[0].id,
      joinDate: "2023-01-15",
      salary: "85000.00",
      pfNumber: "PF001",
      isActive: true
    }).returning();

    const emp2 = await db.insert(employees).values({
      companyId: "default-company",
      employeeId: "EMP002",
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+1-555-0102",
      designation: "HR Manager",
      departmentId: dept2[0].id,
      joinDate: "2022-08-10",
      salary: "75000.00",
      pfNumber: "PF002",
      isActive: true
    }).returning();

    const emp3 = await db.insert(employees).values({
      companyId: "default-company",
      employeeId: "EMP003",
      name: "Mike Chen",
      email: "mike.chen@company.com",
      phone: "+1-555-0103",
      designation: "Frontend Developer",
      departmentId: dept1[0].id,
      joinDate: "2023-06-20",
      salary: "70000.00",
      pfNumber: "PF003",
      isActive: true
    }).returning();

    const emp4 = await db.insert(employees).values({
      companyId: "default-company",
      employeeId: "EMP004",
      name: "Lisa Rodriguez",
      email: "lisa.rodriguez@company.com",
      phone: "+1-555-0104",
      designation: "Marketing Specialist",
      departmentId: dept3[0].id,
      joinDate: "2023-03-01",
      salary: "65000.00",
      pfNumber: "PF004",
      isActive: true
    }).returning();

    // Create leave balances for current year
    const currentYear = new Date().getFullYear();
    
    await db.insert(leaveBalances).values([
      {
        employeeId: emp1[0].id,
        year: currentYear,
        annualLeave: 18,
        sickLeave: 10,
        casualLeave: 8,
        lwpDays: 2
      },
      {
        employeeId: emp2[0].id,
        year: currentYear,
        annualLeave: 21,
        sickLeave: 12,
        casualLeave: 12,
        lwpDays: 0
      },
      {
        employeeId: emp3[0].id,
        year: currentYear,
        annualLeave: 15,
        sickLeave: 8,
        casualLeave: 10,
        lwpDays: 1
      },
      {
        employeeId: emp4[0].id,
        year: currentYear,
        annualLeave: 19,
        sickLeave: 11,
        casualLeave: 9,
        lwpDays: 0
      }
    ]);

    // Create some leave applications
    const leave1 = await db.insert(leaveApplications).values({
      employeeId: emp1[0].id,
      leaveType: "annual",
      fromDate: "2024-12-23",
      toDate: "2024-12-25",
      totalDays: 3,
      reason: "Christmas vacation with family",
      status: "pending"
    }).returning();

    const leave2 = await db.insert(leaveApplications).values({
      employeeId: emp3[0].id,
      leaveType: "sick",
      fromDate: "2024-12-10",
      toDate: "2024-12-11",
      totalDays: 2,
      reason: "Flu symptoms, need rest",
      status: "approved",
      approvedBy: emp2[0].id
    }).returning();

    // Create attendance records for today
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await db.insert(attendanceRecords).values([
      {
        employeeId: emp1[0].id,
        date: today,
        punchIn: new Date(new Date().setHours(9, 15, 0, 0)),
        punchOut: new Date(new Date().setHours(18, 30, 0, 0)),
        workingHours: "9.25",
        overtimeHours: "1.25",
        status: "present"
      },
      {
        employeeId: emp2[0].id,
        date: today,
        punchIn: new Date(new Date().setHours(8, 45, 0, 0)),
        status: "present"
      },
      {
        employeeId: emp3[0].id,
        date: today,
        status: "absent"
      },
      {
        employeeId: emp4[0].id,
        date: today,
        punchIn: new Date(new Date().setHours(9, 0, 0, 0)),
        punchOut: new Date(new Date().setHours(17, 45, 0, 0)),
        workingHours: "8.75",
        overtimeHours: "0.75",
        status: "present"
      },
      // Yesterday's records
      {
        employeeId: emp1[0].id,
        date: yesterday,
        punchIn: new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(9, 0, 0, 0)),
        punchOut: new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(18, 0, 0, 0)),
        workingHours: "9.00",
        overtimeHours: "1.00",
        status: "present"
      },
      {
        employeeId: emp2[0].id,
        date: yesterday,
        punchIn: new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(8, 30, 0, 0)),
        punchOut: new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(17, 30, 0, 0)),
        workingHours: "9.00",
        overtimeHours: "1.00",
        status: "present"
      }
    ]);

    // Create user accounts for login
    await db.insert(users).values([
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
        employeeId: emp2[0].id,
        isActive: true
      },
      {
        username: "john.smith",
        password: hashPassword("john123"),
        role: "employee",
        employeeId: emp1[0].id,
        isActive: true
      },
      {
        username: "mike.chen",
        password: hashPassword("mike123"),
        role: "employee",
        employeeId: emp3[0].id,
        isActive: true
      },
      {
        username: "lisa.rodriguez",
        password: hashPassword("lisa123"),
        role: "employee",
        employeeId: emp4[0].id,
        isActive: true
      }
    ]);

    // Create approval records
    await db.insert(approvals).values([
      {
        employeeId: emp1[0].id,
        approverId: emp2[0].id,
        type: "leave",
        referenceId: leave1[0].id,
        status: "pending",
        level: 1
      },
      {
        employeeId: emp3[0].id,
        approverId: emp2[0].id,
        type: "leave",
        referenceId: leave2[0].id,
        status: "approved",
        level: 1,
        comments: "Approved for sick leave. Get well soon!"
      }
    ]);

    console.log("✅ Database seeded successfully!");
    console.log("📊 Created:");
    console.log("  - 3 departments");
    console.log("  - 4 employees");
    console.log("  - 5 user accounts (admin, hr, employees)");
    console.log("  - Leave balances for all employees");
    console.log("  - 2 leave applications");
    console.log("  - Attendance records for today and yesterday");
    console.log("  - 2 approval records");
    console.log("");
    console.log("🔐 Login Credentials:");
    console.log("  Admin: admin / admin123");
    console.log("  HR Manager: sarah.johnson / sarah123");
    console.log("  Employee: john.smith / john123");
    console.log("  Employee: mike.chen / mike123");
    console.log("  Employee: lisa.rodriguez / lisa123");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();