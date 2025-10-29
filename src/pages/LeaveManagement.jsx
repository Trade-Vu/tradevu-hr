
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Plus, Calendar, CheckCircle, XCircle, Clock, Upload, Paperclip } from "lucide-react";
import { format } from "date-fns";

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    employee_email: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    total_days: 0,
    attachment_url: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser.role === 'admin' || currentUser.is_organization_owner);
        
        const employees = await base44.entities.Employee.filter({ 
          email: currentUser.email 
        });
        if (employees.length > 0) {
          setEmployee(employees[0]);
          setFormData(prev => ({ ...prev, employee_email: employees[0].email }));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
    enabled: isAdmin, // Only fetch employees if the user is an admin
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
    initialData: [],
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      // Determine the employee for whom the leave is being requested
      const selectedEmployee = isAdmin 
        ? employees.find(e => e.email === data.employee_email) 
        : employee;

      if (!selectedEmployee) {
        throw new Error("Employee data not found for the request");
      }
      
      const managers = selectedEmployee?.manager_email ? [selectedEmployee.manager_email] : [];
      
      return base44.entities.LeaveRequest.create({
        ...data, // This will include employee_email, attachment_url, leave_type, dates, reason, etc.
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        // employee_email is already in data due to form field, no need to explicitly re-add
        organization_id: user.organization_id,
        reporting_managers: managers,
        approvers: managers.map(email => ({
          email,
          name: email.split('@')[0],
          status: 'pending'
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setShowForm(false);
      setFormData({
        employee_email: employee?.email || '', // Reset to current user's email or empty
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: '',
        total_days: 0,
        attachment_url: '',
      });
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, attachment_url: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      setFormData(prev => ({ ...prev, attachment_url: '' })); // Clear attachment on error
    }
    setUploadingFile(false);
  };

  const handleApprove = (request, approverEmail) => {
    const updatedApprovers = request.approvers.map(approver => 
      approver.email === approverEmail 
        ? { ...approver, status: 'approved', approved_date: new Date().toISOString() }
        : approver
    );
    
    const allApproved = updatedApprovers.every(a => a.status === 'approved');
    
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        approvers: updatedApprovers,
        status: allApproved ? 'approved' : 'pending'
      }
    });
  };

  const handleReject = (request, approverEmail) => {
    const updatedApprovers = request.approvers.map(approver => 
      approver.email === approverEmail 
        ? { ...approver, status: 'rejected', approved_date: new Date().toISOString() }
        : approver
    );
    
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        approvers: updatedApprovers,
        status: 'rejected'
      }
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0; // Prevent negative days

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleDateChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    if (field === 'start_date' || field === 'end_date') {
      newData.total_days = calculateDays(newData.start_date, newData.end_date);
    }
    setFormData(newData);
  };

  const myRequests = leaveRequests.filter(r => r.employee_email === user?.email);
  const pendingApprovals = leaveRequests.filter(r => 
    r.approvers?.some(a => a.email === user?.email && a.status === 'pending')
  );

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Leave Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Leave Requests
            </h1>
            <p className="text-lg text-slate-600">
              Request time off and manage approvals
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Leave Request
          </Button>
        </div>

        {/* Request Form */}
        {showForm && (
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>New Leave Request</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!formData.attachment_url) {
                    alert("Please upload a supporting document for your leave request.");
                    return;
                  }
                  createLeaveMutation.mutate(formData);
                }}
                className="space-y-6"
              >
                {/* Conditional Employee Selection for Admin */}
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Apply For</Label>
                    <Select 
                      value={formData.employee_email} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employee_email: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.email}>
                            {emp.full_name} - {emp.job_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Leave Type *</Label>
                    <Select 
                      value={formData.leave_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="personal">Personal Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Days</Label>
                    <Input type="number" value={formData.total_days} disabled className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.start_date}
                      onChange={(e) => handleDateChange('start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.end_date}
                      onChange={(e) => handleDateChange('end_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label>Supporting Document * (Required)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="attachment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('attachment').click()}
                      disabled={uploadingFile}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingFile ? 'Uploading...' : 'Upload Document'}
                    </Button>
                    {formData.attachment_url && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Paperclip className="w-4 h-4" />
                        Document attached
                      </div>
                    )}
                    {!formData.attachment_url && (
                      <span className="text-sm text-red-500">
                        No document attached.
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLeaveMutation.isPending || !formData.attachment_url}>
                    {createLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals (for managers) */}
        {pendingApprovals.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="border-b border-orange-200">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Pending Approvals ({pendingApprovals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {pendingApprovals.map(request => (
                <Card key={request.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">{request.employee_name}</h4>
                        <div className="space-y-1 text-sm text-slate-600">
                          <p><strong>Type:</strong> {request.leave_type.replace('_', ' ')}</p>
                          <p><strong>Duration:</strong> {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d')} ({request.total_days} days)</p>
                          <p><strong>Reason:</strong> {request.reason}</p>
                          {request.attachment_url && (
                            <p className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-blue-500" />
                              <a 
                                href={request.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline"
                              >
                                View Document
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(request, user.email)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleReject(request, user.email)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Requests */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>My Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {myRequests.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No leave requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(request => (
                  <Card key={request.id} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-slate-900">
                              {request.leave_type.replace('_', ' ').toUpperCase()}
                            </h4>
                            <Badge variant="outline" className={statusColors[request.status]}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                            </p>
                            <p><strong>Days:</strong> {request.total_days}</p>
                            <p><strong>Reason:</strong> {request.reason}</p>
                            
                            {request.attachment_url && (
                               <p className="flex items-center gap-2">
                                 <Paperclip className="w-4 h-4 text-blue-500" />
                                 <a 
                                   href={request.attachment_url} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="text-blue-600 hover:underline"
                                 >
                                   View Document
                                 </a>
                               </p>
                             )}

                            {request.approvers && request.approvers.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="font-medium text-slate-700 mb-2">Approvals:</p>
                                {request.approvers.map((approver, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span>{approver.name}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`${statusColors[approver.status]} text-xs`}
                                    >
                                      {approver.status}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
