import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, User, MapPin, Building, CreditCard, FileText, Shield, Briefcase } from "lucide-react";
import type { EmployeeWithDepartment } from "@/lib/types";

export default function EmployeeView() {
  const [, setLocation] = useLocation();
  const employeeId = window.location.pathname.split('/')[2];

  const { data: employee, isLoading } = useQuery<EmployeeWithDepartment>({
    queryKey: [`/api/employees/${employeeId}`],
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading employee details...</div>;
  }

  if (!employee) {
    return <div className="flex items-center justify-center h-full">Employee not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/employees")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{employee.name}</h2>
            <p className="text-gray-600">{employee.designation}</p>
          </div>
        </div>
        <Button 
          onClick={() => setLocation(`/employees/${employee.id}/edit`)}
          className="bg-primary hover:bg-blue-700 text-white"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Employee ID</label>
              <p className="font-mono">{employee.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p>{employee.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p>{employee.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p>{employee.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div>
                {employee.isActive ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p>{employee.department.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Designation</label>
              <p>{employee.designation}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Join Date</label>
              <p>{new Date(employee.joinDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Employee Code</label>
              <p>{employee.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Salary</label>
              <p>₹{Number(employee.salary).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Briefcase className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation(`/attendance/${employee.id}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Attendance
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation(`/leaves/${employee.id}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Leave History
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation(`/payroll/${employee.id}`)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payroll Details
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLocation(`/employees/${employee.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Details in 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-2" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Company ID</label>
              <p>{employee.companyId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Department ID</label>
              <p>{employee.departmentId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p>{new Date(employee.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Updated At</label>
              <p>{new Date(employee.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Salary</label>
              <p>₹{Number(employee.salary).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">PF Number</label>
              <p className="font-mono">{employee.pfNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">eSSL Employee ID</label>
              <p className="font-mono">{employee.esslEmployeeId || 'Not assigned'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}