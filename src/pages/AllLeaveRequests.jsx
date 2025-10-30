import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plane, CheckCircle, XCircle, Calendar, Search, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AllLeaveRequests() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
    initialData: [],
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const handleApprove = (request) => {
    const updatedApprovers = (request.approvers || []).map(approver => ({
      ...approver,
      status: 'approved',
      approved_date: new Date().toISOString()
    }));
    
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        approvers: updatedApprovers,
        status: 'approved'
      }
    });
  };

  const handleReject = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      data: { status: 'rejected' }
    });
  };

  const filteredRequests = leaveRequests.filter(req => {
    const matchesSearch = req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.employee_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <Plane className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">Leave Management</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">All Leave Requests</h1>
          <p className="text-lg text-slate-600">View and manage all employee leave requests</p>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredRequests.map(request => (
            <Card key={request.id} className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="font-semibold text-slate-900 text-lg">{request.employee_name}</h4>
                      <Badge variant="outline" className={statusColors[request.status]}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <p><strong>Leave Type:</strong> {request.leave_type?.replace('_', ' ')}</p>
                        <p><strong>Duration:</strong> {request.total_days} days</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </p>
                        <p><strong>Requested:</strong> {format(new Date(request.created_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-3"><strong>Reason:</strong> {request.reason}</p>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(request)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}