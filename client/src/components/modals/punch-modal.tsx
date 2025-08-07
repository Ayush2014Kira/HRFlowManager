import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  
  const currentTime = new Date().toLocaleTimeString();
  const currentDate = new Date().toLocaleDateString();

  const punchInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/punch-in", {
        employeeId: "emp-1" // This should come from auth context in real app
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Punched in successfully!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to punch in",
        variant: "destructive",
      });
    },
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/punch-out", {
        employeeId: "emp-1" // This should come from auth context in real app
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Punched out successfully!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
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
