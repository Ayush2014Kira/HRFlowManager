import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Clock, DollarSign, FileText, Plus, Download } from "lucide-react";
import { format } from "date-fns";

export default function EmployeePortalPage() {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const { toast } = useToast();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: employee } = useQuery({
    queryKey: ["/api/employees", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ["/api/leave-balances", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  const { data: myLeaveApplications } = useQuery({
    queryKey: ["/api/leave-applications/employee", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  const { data: attendanceRecords } = useQuery({
    queryKey: ["/api/attendance", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  const { data: payrollRecords } = useQuery({
    queryKey: ["/api/payroll", currentUser.employeeId],
    enabled: !!currentUser.employeeId,
  });

  const leaveApplicationMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const totalDays = Math.ceil(
        (new Date(leaveData.toDate).getTime() - new Date(leaveData.fromDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      return apiRequest("/api/leave-applications", {
        method: "POST",
        body: JSON.stringify({
          ...leaveData,
          employeeId: currentUser.employeeId,
          totalDays,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Leave Application Submitted",
        description: "Your leave request has been submitted for approval.",
      });
      setIsLeaveDialogOpen(false);
      setLeaveForm({ leaveType: "", fromDate: "", toDate: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications/employee"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave application",
        variant: "destructive",
      });
    },
  });

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leaveType || !leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    leaveApplicationMutation.mutate(leaveForm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Employee Information...</h2>
          <p className="text-gray-600">Please wait while we fetch your details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Employee Portal</h1>
          <p className="text-gray-600">Welcome back, {employee.name}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Annual Leave</p>
                <p className="text-2xl font-bold">{leaveBalance?.annualLeave || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sick Leave</p>
                <p className="text-2xl font-bold">{leaveBalance?.sickLeave || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Casual Leave</p>
                <p className="text-2xl font-bold">{leaveBalance?.casualLeave || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Salary</p>
                <p className="text-2xl font-bold">₹{parseFloat(employee.salary).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaves" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaves">My Leave Applications</TabsTrigger>
          <TabsTrigger value="attendance">My Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Salary Slips</TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Leave Applications</h2>
            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Apply for Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                  <DialogDescription>
                    Submit a new leave application for approval.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select value={leaveForm.leaveType} onValueChange={(value) => setLeaveForm({ ...leaveForm, leaveType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromDate">From Date</Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={leaveForm.fromDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toDate">To Date</Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={leaveForm.toDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Please provide reason for leave..."
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={leaveApplicationMutation.isPending}>
                    {leaveApplicationMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              {myLeaveApplications && myLeaveApplications.length > 0 ? (
                <div className="space-y-4">
                  {myLeaveApplications.map((leave: any) => (
                    <div key={leave.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium capitalize">{leave.leaveType} Leave</h3>
                          <p className="text-sm text-gray-600">
                            {format(new Date(leave.fromDate), "MMM dd, yyyy")} - {format(new Date(leave.toDate), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Applied on {format(new Date(leave.appliedAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(leave.status)}
                          <p className="text-sm text-gray-600 mt-1">{leave.totalDays} day(s)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No leave applications</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by applying for your first leave.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <h2 className="text-xl font-semibold">My Attendance Records</h2>
          <Card>
            <CardContent className="p-6">
              {attendanceRecords && attendanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {attendanceRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{format(new Date(record.date), "EEEE, MMM dd, yyyy")}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            {record.punchIn && (
                              <span>In: {format(new Date(record.punchIn), "hh:mm a")}</span>
                            )}
                            {record.punchOut && (
                              <span>Out: {format(new Date(record.punchOut), "hh:mm a")}</span>
                            )}
                            {record.workingHours && (
                              <span>Hours: {record.workingHours}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant={record.status === "present" ? "default" : "secondary"}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">Your attendance records will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <h2 className="text-xl font-semibold">Salary Slips</h2>
          <Card>
            <CardContent className="p-6">
              {payrollRecords && payrollRecords.length > 0 ? (
                <div className="space-y-4">
                  {payrollRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">
                            {format(new Date(record.payPeriodStart), "MMM yyyy")} Salary
                          </h3>
                          <p className="text-sm text-gray-600">
                            Period: {format(new Date(record.payPeriodStart), "MMM dd")} - {format(new Date(record.payPeriodEnd), "MMM dd, yyyy")}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>Basic Salary: ₹{parseFloat(record.basicSalary).toLocaleString()}</p>
                            <p>Overtime: ₹{parseFloat(record.overtimePay).toLocaleString()}</p>
                            <p>PF Deduction: ₹{parseFloat(record.pfDeduction).toLocaleString()}</p>
                            <p className="font-medium">Net Salary: ₹{parseFloat(record.netSalary).toLocaleString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No salary slips</h3>
                  <p className="mt-1 text-sm text-gray-500">Your salary slips will appear here once generated.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}