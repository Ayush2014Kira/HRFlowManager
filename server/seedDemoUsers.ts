import { storage } from "./storage";
import crypto from "crypto";

async function createDemoUsers() {
  try {
    console.log("Creating demo users...");

    // Hash function for passwords
    const hashPassword = (password: string) => {
      return crypto.createHash('sha256').update(password).digest('hex');
    };

    // Check if users already exist
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Demo users already exist");
      return;
    }

    // Create departments first
    const departments = [
      { name: "Human Resources", description: "HR Department", isActive: true },
      { name: "Engineering", description: "Software Development", isActive: true },
      { name: "Sales", description: "Sales Department", isActive: true }
    ];

    const createdDepartments = [];
    for (const dept of departments) {
      try {
        const created = await storage.createDepartment(dept);
        createdDepartments.push(created);
      } catch (error) {
        // Department might already exist
        console.log(`Department ${dept.name} might already exist`);
      }
    }

    // Create demo users
    const demoUsers = [
      {
        username: "admin",
        password: hashPassword("admin123"),
        role: "admin",
        companyId: "default-company",
        isActive: true,
        email: "admin@democompany.com",
        firstName: "System",
        lastName: "Administrator"
      },
      {
        username: "sarah.johnson",
        password: hashPassword("sarah123"),
        role: "hr",
        companyId: "default-company",
        isActive: true,
        email: "sarah.johnson@democompany.com",
        firstName: "Sarah",
        lastName: "Johnson"
      },
      {
        username: "john.smith",
        password: hashPassword("john123"),
        role: "employee",
        companyId: "default-company",
        isActive: true,
        email: "john.smith@democompany.com",
        firstName: "John",
        lastName: "Smith"
      }
    ];

    for (const userData of demoUsers) {
      try {
        const user = await storage.createUser(userData);
        console.log(`Created user: ${user.username}`);

        // Create corresponding employee record for non-admin users
        if (userData.role !== "admin" && createdDepartments.length > 0) {
          const departmentId = userData.role === "hr" ? 
            createdDepartments[0]?.id : // HR department
            createdDepartments[1]?.id;  // Engineering department

          if (departmentId) {
            try {
              await storage.createEmployee({
                companyId: "default-company",
                locationId: null,
                employeeId: `EMP${Date.now()}`,
                esslEmployeeId: null,
                name: `${userData.firstName} ${userData.lastName}`,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: "+1-555-0100",
                departmentId: departmentId,
                designation: userData.role === "hr" ? "HR Manager" : "Software Developer",
                dateOfJoining: new Date(),
                dateOfBirth: new Date("1990-01-01"),
                address: "123 Demo Street",
                emergencyContact: "+1-555-0200",
                bankAccountNumber: "1234567890",
                ifscCode: "DEMO0000001",
                panNumber: "DEMO12345P",
                aadharNumber: "123456789012",
                pfNumber: null,
                salary: userData.role === "hr" ? 75000 : 65000,
                isActive: true,
                userId: user.id
              });
              console.log(`Created employee record for: ${user.username}`);
            } catch (error) {
              console.log(`Employee record for ${user.username} might already exist`);
            }
          }
        }
      } catch (error) {
        console.log(`User ${userData.username} might already exist`);
      }
    }

    console.log("Demo users setup completed!");
  } catch (error) {
    console.error("Error creating demo users:", error);
  }
}

if (require.main === module) {
  createDemoUsers().then(() => process.exit(0));
}

export { createDemoUsers };