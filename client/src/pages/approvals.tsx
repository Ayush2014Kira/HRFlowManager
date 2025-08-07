import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Search, Clock, Users, Calendar, AlertTriangle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ApprovalWithEmployee, LeaveApplicationWithEmployee } from "@/lib/types";

interface MissPunchRequestWithEmployee {
  id: string;
  employeeId: string;
  date: string;
  punchType: string;
  requestedTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  employee: {
    id: string;
    name: string;
    employeeId: string;
    designation: string;
  };
}

export default function Approvals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalWithEmployee | null>(null);
  const [approvalComments, setApprovalComments] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: approvals, isLoading } = useQuery<ApprovalWithEmployee[]>({
    queryKey: ["/api/approvals"],
  });

  const { data: leaveApplications } = useQuery<LeaveApplicationWithEmployee[]>({
    queryKey: ["/api/leave-applications"],
  });

  const { data: missPunchRequests } = useQuery<MissPunchRequestWithEmployee[]>({
    queryKey: ["/api/miss-punch-requests"],
  });

  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, status, comments }: { id: string; status: 'approved' | 'rejected'; comments?: string }) => {
      const response = await apiRequest("PUT", `/api/approvals/${id}`, {
        status,
        comments,
        updatedAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/miss-punch-requests"] });
      toast({
        title: "Success",
        description: "Approval status updated successfully!",
      });
      setSelectedApproval(null);
      setApprovalComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  const filteredApprovals = approvals?.filter(approval => {
    const matchesSearch = approval.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         approval.employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         approval.status === selectedFilter ||
                         approval.type === selectedFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  const pendingCount = approvals?.filter(a => a.status === 'pending').length || 0;
  const approvedCount = approvals?.filter(a => a.status === 'approved').length || 0;
  const rejectedCount = approvals?.filter(a => a.status === 'rejected').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      leave: "bg-blue-100 text-blue-800",
      miss_punch: "bg-purple-100 text-purple-800",
      overtime: "bg-green-100 text-green-800"
    };
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
      {type.replace('_', ' ').toUpperCase()}
    </Badge>;
  };

  const getLevelBadge = (level: number) => {
    const levels = {
      1: { label: "Manager", color: "bg-blue-100 text-blue-800" },
      2: { label: "HR", color: "bg-green-100 text-green-800" },
      3: { label: "Dept Head", color: "bg-purple-100 text-purple-800" }
    };
    const levelInfo = levels[level as keyof typeof levels] || { label: "L" + level, color: "bg-gray-100 text-gray-800" };
    return <Badge className={levelInfo.color}>{levelInfo.label}</Badge>;
  };

  const getRelatedInfo = (approval: ApprovalWithEmployee) => {
    if (approval.type === 'leave') {
      const leaveApp = leaveApplications?.find(l => l.id === approval.referenceId);
      if (leaveApp) {
        return (
          <div className="text-sm text-gray-600">
            <p>{leaveApp.leaveType.charAt(0).toUpperCase() + leaveApp.leaveType.slice(1)} Leave</p>
            <p>{new Date(leaveApp.fromDate).toLocaleDateString()} - {new Date(leaveApp.toDate).toLocaleDateString()}</p>
            <p>{leaveApp.totalDays} days</p>
          </div>
        );
      }
    } else if (approval.type === 'miss_punch') {
      const missPunch = missPunchRequests?.find(m => m.id === approval.referenceId);
      if (missPunch) {
        return (
          <div className="text-sm text-gray-600">
            <p>Miss Punch - {missPunch.punchType.toUpperCase()}</p>
            <p>{new Date(missPunch.date).toLocaleDateString()}</p>
            <p>{new Date(missPunch.requestedTime).toLocaleTimeString()}</p>
          </div>
        );
      }
    }
    return <div className="text-sm text-gray-400">Details not available</div>;
  };

  const handleApprove = (approval: ApprovalWithEmployee) => {
    updateApprovalMutation.mutate({
      id: approval.id,
      status: 'approved',
      comments: approvalComments
    });
  };

  const handleReject = (approval: ApprovalWithEmployee) => {
    updateApprovalMutation.mutate({
      id: approval.id,
      status: 'rejected',
      comments: approvalComments
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading approvals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Approvals Management</h2>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-orange-600" />
          <span className="text-sm text-gray-600">{pendingCount} pending approvals</span>
        </div>
      </div>

      {/* Approval Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{approvals?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Pending Approvals */}
      {pendingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              Urgent Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvals?.filter(a => a.status === 'pending').slice(0, 3).map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{approval.employee.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeBadge(approval.type)}
                        {getLevelBadge(approval.level)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested on {new Date(approval.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setSelectedApproval(approval)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="leave">Leave Requests</SelectItem>
                <SelectItem value="miss_punch">Miss Punch</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Request Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.map((approval) => (
                  <TableRow key={approval.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{approval.employee.name}</div>
                          <div className="text-sm text-gray-500">{approval.employee.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(approval.type)}</TableCell>
                    <TableCell>{getLevelBadge(approval.level)}</TableCell>
                    <TableCell>{getRelatedInfo(approval)}</TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {approval.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setSelectedApproval(approval)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">
                          {approval.status === 'approved' ? 'Processed' : 'Closed'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredApprovals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No approval requests found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Review Modal */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Approval Request</DialogTitle>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedApproval.employee.name}</h3>
                    <p className="text-sm text-gray-500">{selectedApproval.employee.employeeId} • {selectedApproval.employee.designation}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 mb-3">
                  {getTypeBadge(selectedApproval.type)}
                  {getLevelBadge(selectedApproval.level)}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Request Details:</h4>
                  {getRelatedInfo(selectedApproval)}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Requested on:</strong> {new Date(selectedApproval.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <Textarea
                  rows={3}
                  placeholder="Add your comments here..."
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => handleApprove(selectedApproval)}
                  disabled={updateApprovalMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updateApprovalMutation.isPending ? "Processing..." : "Approve"}
                </Button>
                
                <Button
                  onClick={() => handleReject(selectedApproval)}
                  disabled={updateApprovalMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {updateApprovalMutation.isPending ? "Processing..." : "Reject"}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedApproval(null)}
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
