import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Info } from "lucide-react";

interface LeaveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeaveApplicationModal({ isOpen, onClose }: LeaveApplicationModalProps) {
  // Get current user information
  const { data: currentUser } = useQuery<{ id: string; employeeId?: string; username: string; role: string }>({
    queryKey: ["/api/auth/user"],
    enabled: isOpen
  });

  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
    employeeId: ""
  });

  // Update employeeId when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        employeeId: currentUser.employeeId || currentUser.id || "emp-1"
      }));
    }
  }, [currentUser]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeaveApplication = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/leave-applications", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Leave application submitted successfully!",
      });
      onClose();
      setFormData({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: "",
        employeeId: currentUser?.employeeId || currentUser?.id || "emp-1"
      });
    },
    onError: (error: any) => {
      console.error("Leave application error:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to submit leave application",
        variant: "destructive",
      });
    },
  });

  const calculateTotalDays = (fromDate: string, toDate: string): number => {
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      toast({
        title: "Error",
        description: "From date cannot be later than to date",
        variant: "destructive",
      });
      return;
    }

    createLeaveApplication.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={formData.leaveType} onValueChange={(value) => handleInputChange("leaveType", value)}>
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
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={formData.fromDate}
                onChange={(e) => handleInputChange("fromDate", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={formData.toDate}
                onChange={(e) => handleInputChange("toDate", e.target.value)}
                min={formData.fromDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {formData.fromDate && formData.toDate && (
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Total days: {calculateTotalDays(formData.fromDate, formData.toDate)}
              </span>
            </div>
          )}
          
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Please provide reason for leave..."
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <Info className="inline h-4 w-4 mr-2" />
              Your current leave balance: <span className="font-semibold">18 days</span>
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createLeaveApplication.isPending}
            >
              {createLeaveApplication.isPending ? "Submitting..." : "Submit Application"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
