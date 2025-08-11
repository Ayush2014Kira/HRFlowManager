import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  CalendarX, 
  DollarSign,
  Clock,
  CalendarPlus,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp
} from "lucide-react";
import { useState } from "react";
import LeaveApplicationModal from "@/components/modals/leave-application-modal";
import PunchModal from "@/components/modals/punch-modal";
import MissPunchModal from "@/components/modals/miss-punch-modal";
import PageHeader from "@/components/layout/page-header";
import LoadingState from "@/components/layout/loading-state";
import ErrorState from "@/components/layout/error-state";
import type { DashboardStats, EmployeeWithDepartment, AttendanceWithEmployee, ApprovalWithEmployee } from "@/lib/types";

export default function Dashboard() {
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isMissPunchModalOpen, setIsMissPunchModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: 2
  });

  const { data: employees } = useQuery<EmployeeWithDepartment[]>({
    queryKey: ["/api/employees"],
  });

  const { data: todayAttendance } = useQuery<AttendanceWithEmployee[]>({
    queryKey: ["/api/attendance/today"],
  });

  const { data: pendingApprovals } = useQuery<ApprovalWithEmployee[]>({
    queryKey: ["/api/approvals/pending"],
  });

  const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
  const absentCount = todayAttendance?.filter(a => a.status === 'absent').length || 0;
  const onLeaveCount = todayAttendance?.filter(a => a.status === 'on_leave').length || 0;

  if (statsLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  if (statsError) {
    return <ErrorState message="Failed to load dashboard data" onRetry={refetchStats} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview" 
        subtitle="Monitor your organization's key metrics at a glance"
      >
        <Button onClick={() => setIsPunchModalOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Clock className="h-4 w-4 mr-2" />
          Quick Punch
        </Button>
      </PageHeader>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalEmployees || 0}</p>
                <p className="text-sm text-green-600 mt-1">
                  <ArrowUp className="inline h-4 w-4" /> +12 this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.presentToday || 0}</p>
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="inline h-4 w-4" /> {stats?.attendanceRate || 0}% attendance
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingLeaves || 0}</p>
                <p className="text-sm text-orange-600 mt-1">
                  <Clock className="inline h-4 w-4" /> Awaiting approval
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <CalendarX className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payroll Status</p>
                <p className="text-3xl font-bold text-gray-900">Nov 2024</p>
                <p className="text-sm text-green-600 mt-1">
                  <CheckCircle className="inline h-4 w-4" /> Processed
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Attendance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setIsPunchModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-left transition-colors border-0 h-auto"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    <span className="font-medium text-gray-900">Punch In/Out</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 text-left transition-colors border-0 h-auto"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <CalendarPlus className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="font-medium text-gray-900">Apply Leave</span>
                  </div>
                </Button>
                
                <Button
                  className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 text-left transition-colors border-0 h-auto"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">View Payslip</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setIsMissPunchModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 text-left transition-colors border-0 h-auto"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-900">Report Miss Punch</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Summary */}
        <div className="lg:col-span-2">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">Present</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{presentCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">Absent</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{absentCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <span className="font-medium text-gray-900">On Leave</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{onLeaveCount}</span>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
                    <span className="text-sm font-bold text-primary">{stats?.attendanceRate || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${stats?.attendanceRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending Approvals & Employee Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingApprovals?.length || 0}
              </span>
            </div>
            <div className="space-y-4">
              {pendingApprovals?.slice(0, 3).map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{approval.employee.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{approval.type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {(!pendingApprovals || pendingApprovals.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No pending approvals
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Employees */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Employees</h3>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {employees?.slice(0, 3).map((employee) => (
                <div key={employee.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.designation}</p>
                    <p className="text-xs text-gray-400">{employee.department.name}</p>
                  </div>
                </div>
              ))}
              {(!employees || employees.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No employees found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <LeaveApplicationModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
      />
      <PunchModal 
        isOpen={isPunchModalOpen} 
        onClose={() => setIsPunchModalOpen(false)} 
      />
      <MissPunchModal 
        isOpen={isMissPunchModalOpen} 
        onClose={() => setIsMissPunchModalOpen(false)} 
      />
    </div>
  );
}
