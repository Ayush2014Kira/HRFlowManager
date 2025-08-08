import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const leaveTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  maxDaysPerYear: z.number().min(0, "Must be 0 or more"),
  carryForward: z.boolean().default(false),
  carryForwardLimit: z.number().min(0).optional(),
  companyId: z.string().default("default-company"),
});

type LeaveType = {
  id: string;
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryForward: boolean;
  carryForwardLimit?: number;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
};

export default function LeaveTypesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof leaveTypeSchema>>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      maxDaysPerYear: 0,
      carryForward: false,
      carryForwardLimit: 0,
      companyId: "default-company",
    },
  });

  const { data: leaveTypes, isLoading } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveTypeSchema>) => {
      return await apiRequest("/api/leave-types", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-types"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Leave type created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create leave type",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof leaveTypeSchema>) => {
      return await apiRequest(`/api/leave-types/${editingLeaveType?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-types"] });
      setIsDialogOpen(false);
      setEditingLeaveType(null);
      form.reset();
      toast({
        title: "Success",
        description: "Leave type updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update leave type",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/leave-types/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-types"] });
      toast({
        title: "Success",
        description: "Leave type deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete leave type",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof leaveTypeSchema>) => {
    if (editingLeaveType) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    form.reset({
      name: leaveType.name,
      description: leaveType.description || "",
      maxDaysPerYear: leaveType.maxDaysPerYear,
      carryForward: leaveType.carryForward,
      carryForwardLimit: leaveType.carryForwardLimit || 0,
      companyId: leaveType.companyId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this leave type?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingLeaveType(null);
    form.reset();
  };

  const handleOpenDialog = () => {
    setEditingLeaveType(null);
    form.reset({
      name: "",
      description: "",
      maxDaysPerYear: 0,
      carryForward: false,
      carryForwardLimit: 0,
      companyId: "default-company",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Types</h1>
          <p className="text-muted-foreground">Manage custom leave types for your organization</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingLeaveType ? "Edit Leave Type" : "Create New Leave Type"}
              </DialogTitle>
              <DialogDescription>
                {editingLeaveType ? "Update the leave type details" : "Add a new leave type for employees"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Leave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this leave type..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxDaysPerYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Days Per Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of days allowed per year for this leave type
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingLeaveType ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leaveTypes?.map((leaveType) => (
          <Card key={leaveType.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{leaveType.name}</CardTitle>
                  <CardDescription>{leaveType.description}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(leaveType)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(leaveType.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Max Days/Year:</span>
                  <span className="font-semibold">{leaveType.maxDaysPerYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Carry Forward:</span>
                  <span className={leaveType.carryForward ? "text-green-600" : "text-red-600"}>
                    {leaveType.carryForward ? "Yes" : "No"}
                  </span>
                </div>
                {leaveType.carryForward && leaveType.carryForwardLimit && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Carry Forward Limit:</span>
                    <span className="font-semibold">{leaveType.carryForwardLimit}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {leaveTypes?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leave types found. Create your first leave type to get started.</p>
        </div>
      )}
    </div>
  );
}