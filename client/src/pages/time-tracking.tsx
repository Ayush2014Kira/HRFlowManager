import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Timer,
  CalendarDays,
  User,
  Coffee
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const timeEntrySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  projectName: z.string().optional(),
  taskDescription: z.string().optional(),
  category: z.string().default("work"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
});

type Employee = {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  email: string;
};

type TimeEntry = {
  id: string;
  employeeId: string;
  projectName?: string;
  taskDescription?: string;
  startTime: string;
  endTime?: string;
  totalHours?: string;
  breakDuration: number;
  isActive: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
  employee: Employee;
};

export default function TimeTrackingPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const form = useForm<z.infer<typeof timeEntrySchema>>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      employeeId: "",
      projectName: "",
      taskDescription: "",
      category: "work",
      startTime: "",
      endTime: "",
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: timeEntries, isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", { date: selectedDate, employeeId: selectedEmployeeId }],
  });

  const { data: activeEntry } = useQuery<TimeEntry | null>({
    queryKey: selectedEmployeeId ? [`/api/time-entries/active/${selectedEmployeeId}`] : [],
    enabled: !!selectedEmployeeId,
  });

  const startTimeMutation = useMutation({
    mutationFn: async (data: { employeeId: string; projectName?: string; taskDescription?: string; category?: string }) => {
      return await apiRequest("/api/time-entries/start", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({
        title: "Success",
        description: "Time tracking started successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start time tracking",
        variant: "destructive",
      });
    },
  });

  const stopTimeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/time-entries/${id}/stop`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      toast({
        title: "Success",
        description: "Time tracking stopped successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop time tracking",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timeEntrySchema>) => {
      return await apiRequest("/api/time-entries", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timeEntrySchema>) => {
      return await apiRequest(`/api/time-entries/${editingEntry?.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          startTime: new Date(data.startTime),
          endTime: data.endTime ? new Date(data.endTime) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      setIsDialogOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/time-entries/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof timeEntrySchema>) => {
    if (editingEntry) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStartTime = () => {
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Please select an employee first",
        variant: "destructive",
      });
      return;
    }

    startTimeMutation.mutate({
      employeeId: selectedEmployeeId,
      category: "work",
    });
  };

  const handleStopTime = () => {
    if (activeEntry) {
      stopTimeMutation.mutate(activeEntry.id);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
    form.reset({
      employeeId: entry.employeeId,
      projectName: entry.projectName || "",
      taskDescription: entry.taskDescription || "",
      category: entry.category,
      startTime: entry.startTime ? new Date(entry.startTime).toISOString().slice(0, 16) : "",
      endTime: entry.endTime ? new Date(entry.endTime).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEntry(null);
    form.reset();
  };

  const handleOpenDialog = () => {
    setEditingEntry(null);
    form.reset({
      employeeId: selectedEmployeeId || "",
      projectName: "",
      taskDescription: "",
      category: "work",
      startTime: "",
      endTime: "",
    });
    setIsDialogOpen(true);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "Not set";
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return "0:00";
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'work':
        return <Badge className="bg-blue-100 text-blue-800">Work</Badge>;
      case 'break':
        return <Badge className="bg-orange-100 text-orange-800">Break</Badge>;
      case 'meeting':
        return <Badge className="bg-green-100 text-green-800">Meeting</Badge>;
      default:
        return <Badge variant="secondary">{category}</Badge>;
    }
  };

  const totalHoursToday = timeEntries?.reduce((total, entry) => {
    if (entry.totalHours) {
      return total + parseFloat(entry.totalHours);
    }
    return total;
  }, 0) || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">Track work hours and manage time entries</p>
        </div>
      </div>

      {/* Live Clock and Controls */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Today</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursToday.toFixed(2)}h</div>
            <p className="text-xs text-muted-foreground">
              {timeEntries?.length || 0} entries recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Timer</CardTitle>
            {activeEntry ? (
              <Pause className="h-4 w-4 text-green-600" />
            ) : (
              <Play className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {activeEntry ? (
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(activeEntry.startTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Started at {formatTime(activeEntry.startTime)}
                </p>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-muted-foreground">--:--</div>
                <p className="text-xs text-muted-foreground">No active timer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Time Tracking Controls</CardTitle>
          <CardDescription>Start/stop time tracking and manage entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Select Employee</label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date Filter</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {activeEntry ? (
                <Button 
                  onClick={handleStopTime}
                  disabled={stopTimeMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Timer
                </Button>
              ) : (
                <Button 
                  onClick={handleStartTime}
                  disabled={startTimeMutation.isPending || !selectedEmployeeId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleOpenDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEntry ? "Edit Time Entry" : "Add Time Entry"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEntry ? "Update the time entry details" : "Create a new time entry manually"}
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
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="work">Work</SelectItem>
                                <SelectItem value="break">Break</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="training">Training</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Website Development" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="taskDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe what you worked on..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormDescription>Leave empty for ongoing tasks</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={handleDialogClose}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                          {editingEntry ? "Update" : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5" />
            <CardTitle>Time Entries for {selectedDate}</CardTitle>
          </div>
          <CardDescription>
            {selectedEmployeeId ? 
              `Showing entries for ${employees?.find(e => e.id === selectedEmployeeId)?.name}` :
              "Select an employee to view their time entries"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries && timeEntries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.employee.employeeId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(entry.category)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.projectName || "No project"}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.taskDescription || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatTime(entry.startTime)}</TableCell>
                    <TableCell>{formatTime(entry.endTime)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {entry.totalHours ? `${entry.totalHours}h` : formatDuration(entry.startTime, entry.endTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.isActive ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Completed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
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
              <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedEmployeeId ? 
                  `No time entries found for ${selectedDate}. Start tracking time to see entries here.` :
                  "Select an employee to view their time entries."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}