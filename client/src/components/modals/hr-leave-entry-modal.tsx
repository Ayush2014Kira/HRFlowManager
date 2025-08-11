import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
}

interface LeaveType {
  id: string;
  name: string;
  defaultDays: number;
}

interface HRLeaveEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HRLeaveEntryModal({ isOpen, onClose }: HRLeaveEntryModalProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
    manualEntry: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave-types"],
  });

  const createLeaveEntryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/hr/manual-leave-entry", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Leave entry created successfully!",
      });
      setFormData({
        employeeId: "",
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
        manualEntry: true
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create leave entry",
        variant: "destructive",
      });
    },
  });

  const calculateTotalDays = () => {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.leaveType || !formData.fromDate || !formData.toDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const totalDays = calculateTotalDays();
    createLeaveEntryMutation.mutate({
      ...formData,
      totalDays: totalDays.toString()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            HR Manual Leave Entry
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee">Employee *</Label>
            <Select value={formData.employeeId} onValueChange={(value) => 
              setFormData({ ...formData, employeeId: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
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

          <div>
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select value={formData.leaveType} onValueChange={(value) => 
              setFormData({ ...formData, leaveType: value })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select Leave Type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.name.toLowerCase()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date *</Label>
              <Input
                id="fromDate"
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date *</Label>
              <Input
                id="toDate"
                type="date"
                value={formData.toDate}
                min={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
              />
            </div>
          </div>

          {formData.fromDate && formData.toDate && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <CalendarDays className="inline h-4 w-4 mr-2" />
                Total Days: {calculateTotalDays()}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for leave..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={createLeaveEntryMutation.isPending}
              className="flex-1"
            >
              {createLeaveEntryMutation.isPending ? "Creating..." : "Create Leave Entry"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}