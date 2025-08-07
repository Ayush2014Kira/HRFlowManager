import { db } from "./db";
import { 
  companies, 
  locations, 
  users, 
  departments, 
  employees, 
  leaveBalances,
  esslDevices 
} from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function seedSampleData() {
  console.log("🌱 Starting sample data import...");

  try {
    // 1. Create Companies
    console.log("Creating companies...");
    const companyData = [
      {
        name: "TechCorp Solutions",
        code: "TECH001",
        address: "123 Business Park, Tech City, TC 12345",
        phone: "+1-555-0100",
        email: "info@techcorp.com",
        website: "https://techcorp.com",
        gstin: "29ABCDE1234F1Z5",
        pan: "ABCDE1234F"
      },
      {
        name: "InnovateLabs Pvt Ltd",
        code: "INNO001",
        address: "456 Innovation Hub, StartupVille, SV 67890",
        phone: "+1-555-0200",
        email: "contact@innovatelabs.com",
        website: "https://innovatelabs.com",
        gstin: "29FGHIJ5678K2A6",
        pan: "FGHIJ5678K"
      }
    ];

    const insertedCompanies = await db.insert(companies).values(companyData).returning();
    console.log(`✅ Created ${insertedCompanies.length} companies`);

    // 2. Create Locations
    console.log("Creating office locations...");
    const locationData = [
      {
        companyId: insertedCompanies[0].id,
        name: "Main Office",
        code: "HQ",
        address: "123 Business Park, Tech City, TC 12345",
        latitude: "28.6139",
        longitude: "77.2090"
      },
      {
        companyId: insertedCompanies[0].id,
        name: "Branch Office",
        code: "BR1",
        address: "789 Branch Street, Tech City, TC 12346",
        latitude: "28.6200",
        longitude: "77.2150"
      },
      {
        companyId: insertedCompanies[1].id,
        name: "Innovation Center",
        code: "IC",
        address: "456 Innovation Hub, StartupVille, SV 67890",
        latitude: "19.0760",
        longitude: "72.8777"
      }
    ];

    const insertedLocations = await db.insert(locations).values(locationData).returning();
    console.log(`✅ Created ${insertedLocations.length} locations`);

    // 3. Create Departments
    console.log("Creating departments...");
    const departmentData = [
      { name: "Engineering", code: "ENG" },
      { name: "Human Resources", code: "HR" },
      { name: "Sales & Marketing", code: "SALES" },
      { name: "Finance & Accounts", code: "FIN" },
      { name: "Operations", code: "OPS" },
      { name: "Quality Assurance", code: "QA" },
      { name: "Research & Development", code: "RND" },
      { name: "Customer Support", code: "CS" }
    ];

    const insertedDepartments = await db.insert(departments).values(departmentData).returning();
    console.log(`✅ Created ${insertedDepartments.length} departments`);

    // 4. Create Users and Employees
    console.log("Creating users and employees...");
    const sampleEmployees = [
      // Super Admin
      {
        user: {
          username: "superadmin",
          password: hashPassword("admin123"),
          role: "admin",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "SA001",
          esslEmployeeId: "1",
          name: "Super Admin",
          email: "admin@techcorp.com",
          phone: "+1-555-0101",
          designation: "System Administrator",
          departmentId: insertedDepartments[1].id, // HR
          joinDate: "2024-01-01",
          salary: "150000.00"
        }
      },
      // HR Manager
      {
        user: {
          username: "hr.manager",
          password: hashPassword("hr123"),
          role: "hr",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "HR001",
          esslEmployeeId: "2",
          name: "Sarah Johnson",
          email: "sarah.johnson@techcorp.com",
          phone: "+1-555-0102",
          designation: "HR Manager",
          departmentId: insertedDepartments[1].id, // HR
          joinDate: "2024-02-01",
          salary: "120000.00"
        }
      },
      // Engineering Team Lead
      {
        user: {
          username: "john.smith",
          password: hashPassword("john123"),
          role: "manager",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "ENG001",
          esslEmployeeId: "3",
          name: "John Smith",
          email: "john.smith@techcorp.com",
          phone: "+1-555-0103",
          designation: "Senior Software Engineer",
          departmentId: insertedDepartments[0].id, // Engineering
          joinDate: "2024-01-15",
          salary: "140000.00"
        }
      },
      // Software Engineers
      {
        user: {
          username: "mike.chen",
          password: hashPassword("mike123"),
          role: "employee",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "ENG002",
          esslEmployeeId: "4",
          name: "Mike Chen",
          email: "mike.chen@techcorp.com",
          phone: "+1-555-0104",
          designation: "Software Engineer",
          departmentId: insertedDepartments[0].id, // Engineering
          joinDate: "2024-03-01",
          salary: "110000.00"
        }
      },
      {
        user: {
          username: "lisa.rodriguez",
          password: hashPassword("lisa123"),
          role: "employee",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "ENG003",
          esslEmployeeId: "5",
          name: "Lisa Rodriguez",
          email: "lisa.rodriguez@techcorp.com",
          phone: "+1-555-0105",
          designation: "Frontend Developer",
          departmentId: insertedDepartments[0].id, // Engineering
          joinDate: "2024-04-01",
          salary: "105000.00"
        }
      },
      // Sales Team
      {
        user: {
          username: "david.wilson",
          password: hashPassword("david123"),
          role: "employee",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "SAL001",
          esslEmployeeId: "6",
          name: "David Wilson",
          email: "david.wilson@techcorp.com",
          phone: "+1-555-0106",
          designation: "Sales Manager",
          departmentId: insertedDepartments[2].id, // Sales
          joinDate: "2024-02-15",
          salary: "115000.00"
        }
      },
      // QA Team
      {
        user: {
          username: "anna.kumar",
          password: hashPassword("anna123"),
          role: "employee",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "QA001",
          esslEmployeeId: "7",
          name: "Anna Kumar",
          email: "anna.kumar@techcorp.com",
          phone: "+1-555-0107",
          designation: "QA Engineer",
          departmentId: insertedDepartments[5].id, // QA
          joinDate: "2024-05-01",
          salary: "95000.00"
        }
      },
      // Finance Team
      {
        user: {
          username: "robert.taylor",
          password: hashPassword("robert123"),
          role: "employee",
          companyId: insertedCompanies[0].id
        },
        employee: {
          companyId: insertedCompanies[0].id,
          locationId: insertedLocations[0].id,
          employeeId: "FIN001",
          esslEmployeeId: "8",
          name: "Robert Taylor",
          email: "robert.taylor@techcorp.com",
          phone: "+1-555-0108",
          designation: "Finance Manager",
          departmentId: insertedDepartments[3].id, // Finance
          joinDate: "2024-03-15",
          salary: "130000.00"
        }
      },
      // Second Company Employees
      {
        user: {
          username: "company2.admin",
          password: hashPassword("admin123"),
          role: "admin",
          companyId: insertedCompanies[1].id
        },
        employee: {
          companyId: insertedCompanies[1].id,
          locationId: insertedLocations[2].id,
          employeeId: "INV001",
          esslEmployeeId: "9",
          name: "Emily Davis",
          email: "emily.davis@innovatelabs.com",
          phone: "+1-555-0201",
          designation: "CEO",
          departmentId: insertedDepartments[4].id, // Operations
          joinDate: "2024-01-01",
          salary: "200000.00"
        }
      },
      {
        user: {
          username: "alex.brown",
          password: hashPassword("alex123"),
          role: "employee",
          companyId: insertedCompanies[1].id
        },
        employee: {
          companyId: insertedCompanies[1].id,
          locationId: insertedLocations[2].id,
          employeeId: "INV002",
          esslEmployeeId: "10",
          name: "Alex Brown",
          email: "alex.brown@innovatelabs.com",
          phone: "+1-555-0202",
          designation: "Product Manager",
          departmentId: insertedDepartments[6].id, // R&D
          joinDate: "2024-02-01",
          salary: "125000.00"
        }
      }
    ];

    const insertedUsers = [];
    const insertedEmployees = [];

    for (const empData of sampleEmployees) {
      const [user] = await db.insert(users).values(empData.user).returning();
      insertedUsers.push(user);

      const [employee] = await db.insert(employees).values({
        ...empData.employee,
      }).returning();
      insertedEmployees.push(employee);

      // Update user with employee ID
      await db.update(users)
        .set({ employeeId: employee.id })
        .where(eq(users.id, user.id));
    }

    console.log(`✅ Created ${insertedUsers.length} users and ${insertedEmployees.length} employees`);

    // 5. Create Leave Balances for all employees
    console.log("Creating leave balances...");
    const currentYear = new Date().getFullYear();
    const leaveBalanceData = insertedEmployees.map(emp => ({
      employeeId: emp.id,
      year: currentYear,
      annualLeave: 21,
      sickLeave: 12,
      casualLeave: 12,
      lwpDays: 0
    }));

    const insertedLeaveBalances = await db.insert(leaveBalances).values(leaveBalanceData).returning();
    console.log(`✅ Created ${insertedLeaveBalances.length} leave balance records`);

    // 6. Create eSSL Devices
    console.log("Creating eSSL device configurations...");
    const esslDeviceData = [
      {
        locationId: insertedLocations[0].id,
        deviceId: "ESSL_001",
        deviceName: "Main Entrance",
        ipAddress: "192.168.1.100",
        port: 4370,
        serialNumber: "ESSL2024001",
        model: "K40 Pro"
      },
      {
        locationId: insertedLocations[1].id,
        deviceId: "ESSL_002", 
        deviceName: "Branch Entrance",
        ipAddress: "192.168.2.100",
        port: 4370,
        serialNumber: "ESSL2024002",
        model: "K40 Pro"
      },
      {
        locationId: insertedLocations[2].id,
        deviceId: "ESSL_003",
        deviceName: "Innovation Center Gate",
        ipAddress: "192.168.3.100", 
        port: 4370,
        serialNumber: "ESSL2024003",
        model: "K50 Pro"
      }
    ];

    const insertedEsslDevices = await db.insert(esslDevices).values(esslDeviceData).returning();
    console.log(`✅ Created ${insertedEsslDevices.length} eSSL device configurations`);

    console.log("\n🎉 Sample data import completed successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Super Admin: superadmin / admin123");
    console.log("HR Manager: hr.manager / hr123");
    console.log("Team Lead: john.smith / john123");
    console.log("Employees: mike.chen/mike123, lisa.rodriguez/lisa123, etc.");
    console.log("\n📊 Created:");
    console.log(`- ${insertedCompanies.length} Companies`);
    console.log(`- ${insertedLocations.length} Office Locations`);
    console.log(`- ${insertedDepartments.length} Departments`);
    console.log(`- ${insertedUsers.length} User Accounts`);
    console.log(`- ${insertedEmployees.length} Employee Records`);
    console.log(`- ${insertedLeaveBalances.length} Leave Balance Records`);
    console.log(`- ${insertedEsslDevices.length} eSSL Device Configurations`);

    return {
      companies: insertedCompanies,
      locations: insertedLocations,
      departments: insertedDepartments,
      users: insertedUsers,
      employees: insertedEmployees,
      leaveBalances: insertedLeaveBalances,
      esslDevices: insertedEsslDevices
    };

  } catch (error) {
    console.error("❌ Error during sample data import:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedSampleData()
    .then(() => {
      console.log("✅ Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}