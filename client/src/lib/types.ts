export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  attendanceRate: number;
}

export interface EmployeeWithDepartment {
  id: string;
  companyId: string;
  locationId?: string | null;
  employeeId: string;
  esslEmployeeId?: string | null;
  name: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: string;
  joinDate: string;
  salary: string;
  pfNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
    description?: string;
    managerId?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface AttendanceWithEmployee {
  id: string;
  employeeId: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  workingHours?: string;
  overtimeHours?: string;
  status: 'present' | 'absent' | 'on_leave';
  employee: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
}

export interface LeaveApplicationWithEmployee {
  id: string;
  employeeId: string;
  leaveType: 'annual' | 'sick' | 'casual' | 'emergency';
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
}

export interface ApprovalWithEmployee {
  id: string;
  employeeId: string;
  approverId: string;
  type: 'leave' | 'miss_punch' | 'overtime';
  referenceId: string;
  status: 'pending' | 'approved' | 'rejected';
  level: number;
  comments?: string;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
  approver: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
}
