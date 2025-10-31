
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plane, Plus, CheckCircle, XCircle, Upload, Calendar, Edit } from "lucide-react";
import { format } from "date-fns";

export default function AllLeaveRequests() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    total_days: 0,
    reason: '',
    attachment_url: '',
  });

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

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const createAuditLog = async (action, entityId, entityName, changes = {}) => {
    if (!user || !user.organization_id) {
      console.warn("User or organization_id not available for audit log creation.");
      return;
    }
    try {
      await base44.entities.AuditLog.create({
        organization_id: user.organization_id,
        user_email: user.email,
        user_name: user.full_name,
        action,
        entity_type: 'LeaveRequest',
        entity_id: entityId,
        entity_name,
        changes,
        description: `${action} leave request for ${entityName}`,
        status: 'success',
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  };

  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const employee = employees.find(e => e.id === data.employee_id);
      if (!employee) throw new Error("Employee not found for the selected ID.");

      const manager = employees.find(e => e.email === employee.manager_email);
      
      const leave = await base44.entities.LeaveRequest.create({
        ...data,
        organization_id: user.organization_id,
        employee_name: employee.full_name,
        employee_email: employee.email,
        reporting_managers: manager ? [manager.email] : [],
        applied_by: user.email,
        is_paid: data.leave_type === 'annual' || data.leave_type === 'sick',
      });

      await createAuditLog('create', leave.id, employee.full_name, { after: leave });
      return leave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setShowForm(false);
      setEditingLeave(null);
      setFormData({
        employee_id: '',
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        total_days: 0,
        reason: '',
        attachment_url: '',
      });
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const updated = await base44.entities.LeaveRequest.update(id, data);
      await createAuditLog('update', id, oldData.employee_name, {
        before: oldData,
        after: updated,
        fields_changed: Object.keys(data)
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setEditingLeave(null);
      setShowForm(false);
    },
  });

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setFormData({
      employee_id: leave.employee_id,
      leave_type: leave.leave_type,
      start_date: leave.start_date ? new Date(leave.start_date).toISOString().split('T')[0] : '',
      end_date: leave.end_date ? new Date(leave.end_date).toISOString().split('T')[0] : '',
      total_days: leave.total_days,
      reason: leave.reason,
      attachment_url: leave.attachment_url || '',
    });
    setShowForm(true);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, attachment_url: file_url }));
    } catch (error) {
      console.error("Error uploading:", error);
    }
    setUploadingDoc(false);
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, total_days: days > 0 ? days : 0 }));
    } else {
      setFormData(prev => ({ ...prev, total_days: 0 }));
    }
  };

  useEffect(() => {
    calculateDays();
  }, [formData.start_date, formData.end_date]);

  const handleApprove = (leave) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: {
        status: 'approved',
        approvers: [...(leave.approvers || []), {
          email: user.email,
          name: user.full_name,
          status: 'approved',
          approved_date: new Date().toISOString(),
        }]
      },
      oldData: leave // Pass the original leave object for audit logging
    });
  };

  const handleReject = (leave) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: {
        status: 'rejected',
        approvers: [...(leave.approvers || []), {
          email: user.email,
          name: user.full_name,
          status: 'rejected',
          approved_date: new Date().toISOString(),
        }]
      },
      oldData: leave // Pass the original leave object for audit logging
    });
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Leave Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Leave Requests</h1>
            <p className="text-lg text-slate-600">Manage and approve employee leave requests</p>
          </div>
          <Dialog open={showForm} onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setEditingLeave(null);
              setFormData({
                employee_id: '',
                leave_type: 'annual',
                start_date: '',
                end_date: '',
                total_days: 0,
                reason: '',
                attachment_url: '',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingLeave ? 'Edit' : 'Create'} Leave Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingLeave) {
                  updateLeaveMutation.mutate({ id: editingLeave.id, data: formData, oldData: editingLeave });
                } else {
                  createLeaveMutation.mutate(formData);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))} disabled={!!editingLeave}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <Select value={formData.leave_type} onValueChange={(value) => setFormData(prev => ({ ...prev, leave_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input type="number" value={formData.total_days} readOnly className="bg-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={formData.reason} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} rows={3} required />
                </div>

                <div className="space-y-2">
                  <Label>Supporting Document (Optional)</Label>
                  <input type="file" onChange={handleDocUpload} className="hidden" id="leave-doc" />
                  <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('leave-doc').click()} disabled={uploadingDoc}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingDoc ? 'Uploading...' : formData.attachment_url ? 'Document Uploaded ✓' : 'Upload Document'}
                  </Button>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLeaveMutation.isPending || updateLeaveMutation.isPending}>
                    {(createLeaveMutation.isPending || updateLeaveMutation.isPending) ? 'Saving...' : editingLeave ? 'Update Request' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-4">
                {leaveRequests.filter(l => l.status === 'pending').length}
              </p>
              <p className="text-sm text-slate-600">Pending Approvals</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-4">
                {leaveRequests.filter(l => l.status === 'approved').length}
              </p>
              <p className="text-sm text-slate-600">Approved</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mt-4">{leaveRequests.length}</p>
              <p className="text-sm text-slate-600">Total Requests</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>All Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {leaveRequests.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No leave requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map(leave => (
                  <div key={leave.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold">
                              {leave.employee_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{leave.employee_name}</p>
                            <p className="text-sm text-slate-600 capitalize">
                              {leave.leave_type.replace('_', ' ')} • {leave.total_days} days
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          {format(new Date(leave.start_date), 'MMM dd, yyyy')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-slate-500 italic">"{leave.reason}"</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[leave.status]}>
                          {leave.status}
                        </Badge>
                        {leave.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="p-2 h-auto" onClick={() => handleEdit(leave)}>
                              <Edit className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(leave)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(leave)}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
