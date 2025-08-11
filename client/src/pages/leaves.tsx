import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarPlus, Search, Calendar, Users } from "lucide-react";
import { useState } from "react";
import LeaveApplicationModal from "@/components/modals/leave-application-modal";
import PageHeader from "@/components/layout/page-header";
import LoadingState from "@/components/layout/loading-state";
import ErrorState from "@/components/layout/error-state";
import type { LeaveApplicationWithEmployee } from "@/lib/types";

export default function Leaves() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const { data: leaveApplications, isLoading } = useQuery<LeaveApplicationWithEmployee[]>({
    queryKey: ["/api/leave-applications"],
  });

  const filteredApplications = leaveApplications?.filter(application =>
    application.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    application.employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      annual: "bg-blue-100 text-blue-800",
      sick: "bg-red-100 text-red-800",
      casual: "bg-green-100 text-green-800",
      emergency: "bg-purple-100 text-purple-800"
    };
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>;
  };

  const pendingCount = filteredApplications.filter(app => app.status === 'pending').length;
  const approvedCount = filteredApplications.filter(app => app.status === 'approved').length;
  const rejectedCount = filteredApplications.filter(app => app.status === 'rejected').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading leave applications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Leave Management</h2>
        <Button 
          onClick={() => setIsLeaveModalOpen(true)}
          className="bg-primary hover:bg-blue-700 text-white"
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      {/* Leave Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{filteredApplications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Annual Leave</p>
              <p className="text-2xl font-bold text-blue-600">18 days</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Sick Leave</p>
              <p className="text-2xl font-bold text-green-600">10 days</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Casual Leave</p>
              <p className="text-2xl font-bold text-orange-600">8 days</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">LWP Days</p>
              <p className="text-2xl font-bold text-red-600">2 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leave applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Leave Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{application.employee.name}</div>
                          <div className="text-sm text-gray-500">{application.employee.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(application.leaveType)}</TableCell>
                    <TableCell>{new Date(application.fromDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(application.toDate).toLocaleDateString()}</TableCell>
                    <TableCell>{application.totalDays} days</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>{new Date(application.appliedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={application.reason}>
                        {application.reason}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredApplications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No leave applications found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Application Modal */}
      <LeaveApplicationModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
      />
    </div>
  );
}
