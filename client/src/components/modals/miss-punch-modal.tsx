import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MissPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MissPunchModal({ isOpen, onClose }: MissPunchModalProps) {
  const [formData, setFormData] = useState({
    date: "",
    punchType: "",
    requestedTime: "",
    reason: "",
    employeeId: "emp-1" // This should come from auth context in real app
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMissPunchRequest = useMutation({
    mutationFn: async (data: typeof formData) => {
      const requestedDateTime = new Date(`${data.date}T${data.requestedTime}`);
      const payload = {
        ...data,
        requestedTime: requestedDateTime.toISOString()
      };
      const response = await apiRequest("POST", "/api/miss-punch-requests", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/miss-punch-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      toast({
        title: "Success",
        description: "Miss punch request submitted successfully!",
      });
      onClose();
      setFormData({
        date: "",
        punchType: "",
        requestedTime: "",
        reason: "",
        employeeId: "emp-1"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit miss punch request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.punchType || !formData.requestedTime || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMissPunchRequest.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Miss Punch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="punchType">Punch Type</Label>
            <Select value={formData.punchType} onValueChange={(value) => handleInputChange("punchType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select punch type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Punch In</SelectItem>
                <SelectItem value="out">Punch Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="requestedTime">Requested Time</Label>
            <Input
              id="requestedTime"
              type="time"
              value={formData.requestedTime}
              onChange={(e) => handleInputChange("requestedTime", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Please provide reason for missed punch..."
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
            />
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-800">
              Miss punch requests require manager approval. You can submit up to 3 miss punch requests per month.
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createMissPunchRequest.isPending}
            >
              {createMissPunchRequest.isPending ? "Submitting..." : "Submit Request"}
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
