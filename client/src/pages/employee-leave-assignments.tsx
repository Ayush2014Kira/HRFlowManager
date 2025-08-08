import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const assignmentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave type is required"),
  allocatedDays: z.number().min(0, "Must be 0 or more"),
  year: z.number().min(2020).max(2030),
});

type Employee = {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  email: string;
};

type LeaveType = {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
};

type EmployeeLeaveAssignment = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  employee: Employee;
  leaveType: LeaveType;
};

export default function EmployeeLeaveAssignmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EmployeeLeaveAssignment | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: "",
      leaveTypeId: "",
      allocatedDays: 0,
      year: new Date().getFullYear(),
    },
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<EmployeeLeaveAssignment[]>({
    queryKey: ["/api/employee-leave-assignments", { year: selectedYear }],
    queryFn: () => apiRequest(`/api/employee-leave-assignments?year=${selectedYear}`),
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema>) => {
      return await apiRequest("/api/employee-leave-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-leave-assignments"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Leave assignment created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create leave assignment",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof assignmentSchema>) => {
      return await apiRequest(`/api/employee-leave-assignments/${editingAssignment?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-leave-assignments"] });
      setIsDialogOpen(false);
      setEditingAssignment(null);
      form.reset();
      toast({
        title: "Success",
        description: "Leave assignment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update leave assignment",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/employee-leave-assignments/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-leave-assignments"] });
      toast({
        title: "Success",
        description: "Leave assignment deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete leave assignment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof assignmentSchema>) => {
    if (editingAssignment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (assignment: EmployeeLeaveAssignment) => {
    setEditingAssignment(assignment);
    form.reset({
      employeeId: assignment.employeeId,
      leaveTypeId: assignment.leaveTypeId,
      allocatedDays: assignment.allocatedDays,
      year: assignment.year,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this leave assignment?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAssignment(null);
    form.reset();
  };

  const handleOpenDialog = () => {
    setEditingAssignment(null);
    form.reset({
      employeeId: "",
      leaveTypeId: "",
      allocatedDays: 0,
      year: new Date().getFullYear(),
    });
    setIsDialogOpen(true);
  };

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  if (assignmentsLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Leave Assignments</h1>
          <p className="text-muted-foreground">Assign leave quotas to employees for different leave types</p>
        </div>
        <div className="flex space-x-2">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? "Edit Leave Assignment" : "Create Leave Assignment"}
                </DialogTitle>
                <DialogDescription>
                  {editingAssignment ? "Update the leave assignment details" : "Assign leave quota to an employee"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} ({employee.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leaveTypes?.map((leaveType) => (
                              <SelectItem key={leaveType.id} value={leaveType.id}>
                                {leaveType.name} (Max: {leaveType.maxDaysPerYear} days)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allocatedDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocated Days</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days allocated to this employee for this leave type
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingAssignment ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <CardTitle>Leave Assignments for {selectedYear}</CardTitle>
          </div>
          <CardDescription>
            Manage employee leave allocations and track usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.employee.employeeId} • {assignment.employee.designation}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.leaveType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Max: {assignment.leaveType.maxDaysPerYear} days/year
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{assignment.allocatedDays}</span> days
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{assignment.usedDays}</span> days
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${assignment.remainingDays > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {assignment.remainingDays}
                      </span> days
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(assignment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No leave assignments found for {selectedYear}. Create assignments to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}