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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Search, Download, Users, Calculator, Clock, FileText } from "lucide-react";
import { useState } from "react";
import type { EmployeeWithDepartment } from "@/lib/types";

interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: string;
  workingDays: number;
  presentDays: number;
  overtimeHours: string;
  overtimeAmount: string;
  pfDeduction: string;
  lwpDeduction: string;
  netSalary: string;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
}

export default function Payroll() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: employees } = useQuery<EmployeeWithDepartment[]>({
    queryKey: ["/api/employees"],
  });

  const { data: payrollRecords, isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll"],
  });

  const filteredRecords = payrollRecords?.filter(record => {
    const matchesSearch = record.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = record.month === selectedMonth;
    const matchesYear = record.year === selectedYear;
    return matchesSearch && matchesMonth && matchesYear;
  }) || [];

  const totalPayroll = filteredRecords.reduce((sum, record) => sum + Number(record.netSalary), 0);
  const totalPfDeduction = filteredRecords.reduce((sum, record) => sum + Number(record.pfDeduction), 0);
  const totalOvertimePay = filteredRecords.reduce((sum, record) => sum + Number(record.overtimeAmount), 0);

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading payroll records...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Payroll & Salary Management</h2>
        <div className="flex space-x-3">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            <Calculator className="h-4 w-4 mr-2" />
            Generate Payroll
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Employees Processed</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total PF Deduction</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalPfDeduction.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overtime Pay</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalOvertimePay.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Processing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Current Month</span>
                <Badge className="bg-green-100 text-green-800">Processed</Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
              <p className="text-sm text-gray-600 mt-1">Last processed on {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Average Salary</span>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ₹{filteredRecords.length > 0 ? Math.round(totalPayroll / filteredRecords.length).toLocaleString() : '0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Per employee this month</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Next Processing</span>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {selectedMonth === 12 ? 'Jan' : months.find(m => m.value === selectedMonth + 1)?.label} {selectedMonth === 12 ? selectedYear + 1 : selectedYear}
              </p>
              <p className="text-sm text-gray-600 mt-1">Scheduled for month end</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Salary Records - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Present Days</TableHead>
                  <TableHead>Overtime Hours</TableHead>
                  <TableHead>Overtime Pay</TableHead>
                  <TableHead>PF Deduction</TableHead>
                  <TableHead>LWP Deduction</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{record.employee.name}</div>
                          <div className="text-sm text-gray-500">{record.employee.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>₹{Number(record.basicSalary).toLocaleString()}</TableCell>
                    <TableCell>{record.workingDays}</TableCell>
                    <TableCell>{record.presentDays}</TableCell>
                    <TableCell>{record.overtimeHours}h</TableCell>
                    <TableCell>₹{Number(record.overtimeAmount).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(record.pfDeduction).toLocaleString()}</TableCell>
                    <TableCell>₹{Number(record.lwpDeduction).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ₹{Number(record.netSalary).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Payslip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payroll records found for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
