import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Clock, LogIn, LogOut } from "lucide-react";

interface PunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PunchModal({ isOpen, onClose }: PunchModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user information
  const { data: currentUser } = useQuery<{ id: string; employeeId?: string; username: string; role: string }>({
    queryKey: ["/api/auth/user"],
    enabled: isOpen
  });
  
  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  const punchInMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/attendance/punch-in", {
        method: "POST",
        body: JSON.stringify({
          employeeId: currentUser?.employeeId || currentUser?.id || "emp-1"
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const punchTime = data.punchIn ? new Date(data.punchIn).toLocaleTimeString() : currentTime;
      toast({
        title: "Punch In Successful",
        description: `Punched in at ${punchTime}`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Punch In Failed",
        description: error.message || "Failed to punch in",
        variant: "destructive",
      });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/attendance/punch-out", {
        method: "POST",
        body: JSON.stringify({
          employeeId: currentUser?.employeeId || currentUser?.id || "emp-1"
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const punchTime = data.punchOut ? new Date(data.punchOut).toLocaleTimeString() : currentTime;
      const workingHours = data.workingHours || "0.00";
      toast({
        title: "Punch Out Successful",
        description: `Punched out at ${punchTime}. Worked ${workingHours} hours.`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Punch Out Failed", 
        description: error.message || "Failed to punch out",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attendance Punch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{currentTime}</h3>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => punchInMutation.mutate()}
              disabled={punchInMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {punchInMutation.isPending ? "Punching In..." : "Punch In"}
            </Button>
            
            <Button
              onClick={() => punchOutMutation.mutate()}
              disabled={punchOutMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {punchOutMutation.isPending ? "Punching Out..." : "Punch Out"}
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <Clock className="inline h-4 w-4 mr-2" />
              GPS location will be recorded for attendance tracking
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
