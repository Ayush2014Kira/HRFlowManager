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
              <label className="text-sm font-medium text-gray-500">Total Salary</label>
              <p>₹{Number(employee.salary).toLocaleString()}</p>
            </div>
            {employee.pfNumber && (
              <div>
                <label className="text-sm font-medium text-gray-500">PF Number</label>
                <p className="font-mono">{employee.pfNumber}</p>
              </div>
            )}
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

      {/* Additional Details */}
      {(employee.currentAddress || employee.bankName || employee.pfNumber) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Address Information */}
          {employee.currentAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Address</label>
                  <p>{employee.currentAddress}</p>
                </div>
                {employee.city && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p>{employee.city}</p>
                  </div>
                )}
                {employee.pinCode && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-gray-500">PIN Code</label>
                    <p>{employee.pinCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bank Information */}
          {employee.bankName && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p>{employee.bankName}</p>
                </div>
                {employee.accountNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Number</label>
                    <p className="font-mono">****{employee.accountNumber.slice(-4)}</p>
                  </div>
                )}
                {employee.ifscCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                    <p className="font-mono">{employee.ifscCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}