import { calculateWorkingDays } from "@/lib/leaveDays";
import LeaveBalances from "@/components/Leave/LeaveBalances";
import PendingLeaveApprovals from "@/components/Leave/PendingLeaveApprovals";
import MyLeaveRequests from "@/components/Leave/MyLeaveRequests";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi, employeesApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Plus, Calendar, CheckCircle, XCircle, Clock, Upload, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LeaveOverview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isPastLeave, setIsPastLeave] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.is_organization_owner;
  const isManager = user?.role === 'MANAGER';
  const [formData, setFormData] = useState({
    employee_email: user?.email || '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    total_days: 0,
    attachment_url: '',
    isHalfDay: false,
    useMultipleDates: false,
    selectedDates: [],
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, employee_email: user.email }));
    }
  }, [user]);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const data = await employeesApi.getEmployees();
      const list = Array.isArray(data) ? data : data?.data || [];
      return list.map(e => ({ ...e, id: e._id || e.id, full_name: e.fullName || e.full_name }));
    },
    initialData: [],
    enabled: isAdmin,
  });

  useEffect(() => {
    if (employees.length > 0 && user) {
      setEmployee(employees.find(e => e.email === user.email));
    }
  }, [employees, user]);

  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await leaveApi.getLeaveTypes();
      const list = Array.isArray(res) ? res : res?.data || [];
      return list.map(type => ({ ...type, id: type.id || type._id }));
    },
    initialData: [],
  });

  const { data: publicHolidays = [] } = useQuery({
    queryKey: ['publicHolidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  useEffect(() => {
    if (leaveTypes.length > 0 && !formData.leave_type) {
      setFormData(prev => ({ ...prev, leave_type: leaveTypes[0].id }));
    }
  }, [leaveTypes]);

  const activeEmployeeId = isAdmin && formData.employee_email 
    ? employees.find(e => e.email === formData.employee_email)?.id 
    : user?.employeeId;

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', activeEmployeeId],
    queryFn: async () => {
      const payload = isAdmin || isManager
        ? await leaveApi.getAllRequests({ page: 1, limit: 200, employeeId: activeEmployeeId })
        : await leaveApi.getMyRequests({ page: 1, limit: 200 });

      const list = Array.isArray(payload) ? payload : payload?.data || [];
      return list.map(l => {
        const employee = l.employeeId || {};
        const typeName = l.leaveTypeId?.name || l.leaveType?.name || 'Annual Leave';

        return {
          ...l,
          id: l._id || l.id,
          employee_email: employee.email || l.employee_email || (typeof employee === 'string' ? employee : ''),
          employee_name: employee.fullName || l.employee_name || (typeof employee === 'string' ? employee : 'Employee'),
          leave_type: typeName,
          start_date: l.startDate || l.start_date,
          end_date: l.endDate || l.end_date,
          total_days: l.totalDays || l.total_days || 0,
          isHalfDay: !!l.isHalfDay,
          selectedDates: l.selectedDates || [],
          attachment_url: l.attachmentUrl || l.attachment_url || '',
          approvers: l.approvers || [],
        };
      });
    },
    enabled: !!activeEmployeeId || !!user,
    initialData: [],
  });

  const { data: leaveBalances = [], refetch: refetchBalances } = useQuery({
    queryKey: ['leave-balances', activeEmployeeId],
    queryFn: async () => {
      const res = activeEmployeeId
        ? await leaveApi.getBalances(activeEmployeeId)
        : await leaveApi.getMyBalance(new Date().getFullYear());

      const item = Array.isArray(res) ? res : res?.data || res;
      if (item && Array.isArray(item.balances)) {
        return item.balances.map((balance) => ({
          ...balance,
          id: balance._id || balance.id,
          leaveTypeId: balance.leaveTypeId?._id || balance.leaveTypeId || balance.leaveType || '',
          leaveType: balance.leaveTypeId?.name || balance.leaveType?.name || 'Leave',
          totalEntitled: balance.allocated ?? balance.totalEntitled ?? 0,
          used: balance.used ?? 0,
          pending: balance.pending ?? 0,
          available: balance.remaining ?? balance.available ?? 0,
          carriedForward: balance.carryOver ?? balance.carriedForward ?? 0,
        }));
      }
      return Array.isArray(item) ? item : [];
    },
    enabled: !!user,
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const start = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[0] : data.start_date;
      const end = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[data.selectedDates.length - 1] : data.end_date;

      return leaveApi.createRequest({
        leaveTypeId: data.leave_type,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        reason: data.reason,
        attachmentUrl: data.attachment_url,
        isHalfDay: !!data.isHalfDay,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetchBalances();
      setShowForm(false);
      setFormData({
        employee_email: employee?.email || '',
        leave_type: leaveTypes.length > 0 ? leaveTypes[0].id : '',
        start_date: '',
        end_date: '',
        reason: '',
        total_days: 0,
        attachment_url: '',
        isHalfDay: false,
        useMultipleDates: false,
        selectedDates: [],
      });
    },
    onError: (error) => {
      console.error(error);
      const msg = extractErrorMessage(error, "Failed to submit leave request.");
      toast.error(msg);
    }
  });

  const logPastLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const start = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[0] : data.start_date;
      const end = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[data.selectedDates.length - 1] : data.end_date;

      return leaveApi.createRequest({
        leaveTypeId: data.leave_type,
        startDate: new Date(start).toISOString(),
        endDate: new Date(end).toISOString(),
        reason: data.reason,
        attachmentUrl: data.attachment_url,
        isHalfDay: !!data.isHalfDay,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      refetchBalances();
      setShowForm(false);
      setFormData({
        employee_email: employee?.email || '',
        leave_type: leaveTypes.length > 0 ? leaveTypes[0].id : '',
        start_date: '',
        end_date: '',
        reason: '',
        total_days: 0,
        attachment_url: '',
        isHalfDay: false,
        useMultipleDates: false,
        selectedDates: [],
      });
      toast.success("Past leave successfully logged");
    },
    onError: (error) => {
      console.error(error);
      const msg = extractErrorMessage(error, "Failed to log past leave.");
      toast.error(msg);
    }
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      if (status === 'APPROVED') {
        return leaveApi.reviewRequest(id, { action: 'approved' });
      } else if (status === 'REJECTED') {
        return leaveApi.reviewRequest(id, { action: 'rejected', rejectionReason: 'Rejected by reviewer' });
      } else if (status === 'CANCELLED') {
        return leaveApi.cancelRequest(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      let actionText = 'updated';
      if (variables.status === 'APPROVED') actionText = 'approved';
      if (variables.status === 'REJECTED') actionText = 'rejected';
      if (variables.status === 'CANCELLED') actionText = 'cancelled';
      
      toast.success(`Leave request successfully ${actionText}`);
    },
    onError: (error) => {
      console.error(error);
      const msg = extractErrorMessage(error, "Failed to update leave request.");
      toast.error(msg);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload document to cloud storage.");
      }
      setFormData(prev => ({ ...prev, attachment_url: uploadResult.secure_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
      setFormData(prev => ({ ...prev, attachment_url: '' })); // Clear attachment on error
    }
    setUploadingFile(false);
  };

  const handleApprove = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      status: 'APPROVED'
    });
  };

  const handleReject = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      status: 'REJECTED'
    });
  };

  const handleCancel = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      status: 'CANCELLED'
    });
  };

  const calculateDays = (start, end) => calculateWorkingDays(start, end, publicHolidays);

  const safeDate = (val) => {
    if (!val) return new Date();
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    const num = Number(val);
    if (!isNaN(num)) return new Date(num);
    return new Date();
  };

  const handleDateChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'start_date' || field === 'end_date') {
        const days = calculateDays(newData.start_date, newData.end_date);
        newData.total_days = newData.isHalfDay ? days * 0.5 : days;
      }
      return newData;
    });
  };

  const addSelectedDate = (date) => {
    if (!date) return;
    const newDates = [...formData.selectedDates, date].sort();
    const workingDays = newDates.reduce((total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays), 0);
    setFormData({ ...formData, selectedDates: newDates, total_days: formData.isHalfDay ? workingDays * 0.5 : workingDays });
  };

  const removeSelectedDate = (date) => {
    const newDates = formData.selectedDates.filter(d => d !== date);
    const workingDays = newDates.reduce((total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays), 0);
    setFormData({ ...formData, selectedDates: newDates, total_days: formData.isHalfDay ? workingDays * 0.5 : workingDays });
  };

  const myRequests = leaveRequests.filter(r => r.employee_email === user?.email);
  const pendingApprovals = leaveRequests.filter(r => {
    if (r.employee_email === user?.email) return false;
    if (isAdmin) {
      return r.status === 'PENDING' || r.status === 'PENDING_HR' || r.status === 'PENDING_SUPER_ADMIN';
    }
    if (isManager) {
      return r.status === 'PENDING';
    }
    return false;
  });

  const statusColors = {
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PENDING_HR: 'bg-purple-100 text-purple-800 border-purple-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const selectedLeaveTypeObj = leaveTypes.find(t => t.id === formData.leave_type);
  const requiresAttachment = selectedLeaveTypeObj && (
    selectedLeaveTypeObj.name === 'Study Leave' || 
    (selectedLeaveTypeObj.name === 'Sick Leave' && formData.total_days > 2)
  );

  const hasRequiredRequestData = Boolean(
    formData.leave_type &&
    formData.reason.trim() &&
    formData.total_days > 0 &&
    (formData.useMultipleDates
      ? formData.selectedDates.length > 0
      : formData.start_date && formData.end_date) &&
    (!isAdmin || formData.employee_email) &&
    (!requiresAttachment || formData.attachment_url)
  );

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-50 to-blue-50 md:p-8">
      <div className="mx-auto space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white rounded-full shadow-sm">
              <Plane className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Leave Management</span>
            </div>
            
            <p className="text-lg text-slate-600">
              Request time off and manage approvals
            </p>
          </div>
          {leaveTypes.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={() => { setShowForm(true); setIsPastLeave(true); }}
                variant="outline"
              >
                Log Past Leave
              </Button>
              <Button 
                onClick={() => { setShowForm(true); setIsPastLeave(false); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Leave Request
              </Button>
            </div>
          )}
        </div>

        <LeaveBalances leaveBalances={leaveBalances} leaveTypes={leaveTypes} isAdmin={isAdmin} />

        {/* Request Form */}
        {showForm && (
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <CardTitle>{isPastLeave ? 'Log Past Leave' : 'New Leave Request'}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!hasRequiredRequestData) {
                    toast.error('Complete all required leave request fields before submitting.');
                    return;
                  }
                  if (requiresAttachment && !formData.attachment_url) {
                    toast.error("Please upload a supporting document for your leave request.");
                    return;
                  }
                  
                  const selectedBalance = leaveBalances.find(b => b.leaveTypeId === formData.leave_type);
                  if (selectedBalance && formData.total_days > selectedBalance.available) {
                    toast.error(`You cannot request ${formData.total_days} days. You only have ${selectedBalance.available} available for this leave type.`);
                    return;
                  }

                  if (isPastLeave) {
                    logPastLeaveMutation.mutate(formData);
                  } else {
                    createLeaveMutation.mutate(formData);
                  }
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

                <div className="grid gap-6 md:grid-cols-2">
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
                        {leaveTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isPastLeave && selectedLeaveTypeObj?.noticeDaysRequired > 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        Requires at least {selectedLeaveTypeObj.noticeDaysRequired} days notice.
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="isHalfDay" 
                        checked={formData.isHalfDay} 
                        onChange={(e) => {
                          const isHalf = e.target.checked;
                          let tDays = 0;
                          let newEndDate = formData.end_date;
                          if (isHalf && !formData.useMultipleDates) {
                            newEndDate = formData.start_date;
                          }
                          if (formData.useMultipleDates) {
                            tDays = formData.selectedDates.length * (isHalf ? 0.5 : 1);
                          } else {
                            tDays = calculateDays(formData.start_date, newEndDate) * (isHalf ? 0.5 : 1);
                          }
                          setFormData({ ...formData, isHalfDay: isHalf, end_date: newEndDate, total_days: tDays });
                        }} 
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="isHalfDay">Half-Day Request</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="useMultipleDates" 
                        checked={formData.useMultipleDates} 
                        onChange={(e) => {
                          const useMultiple = e.target.checked;
                          let tDays = 0;
                          if (useMultiple) {
                            tDays = formData.selectedDates.length * (formData.isHalfDay ? 0.5 : 1);
                          } else {
                            tDays = calculateDays(formData.start_date, formData.end_date) * (formData.isHalfDay ? 0.5 : 1);
                          }
                          setFormData({ ...formData, useMultipleDates: useMultiple, total_days: tDays });
                        }} 
                        className="rounded border-slate-300"
                      />
                      <Label htmlFor="useMultipleDates">Multiple Non-Continuous Dates</Label>
                    </div>
                  </div>

                  {!formData.useMultipleDates ? (
                    <>
                      <div className="space-y-2">
                        <Label>Start Date *</Label>
                        <Input 
                          type="date" 
                          value={formData.start_date}
                          onChange={(e) => {
                            handleDateChange('start_date', e.target.value);
                            if (formData.isHalfDay) {
                               handleDateChange('end_date', e.target.value);
                            }
                          }}
                          required
                        />
                      </div>

                      {!formData.isHalfDay && (
                        <div className="space-y-2">
                          <Label>End Date *</Label>
                          <Input 
                            type="date" 
                            value={formData.end_date}
                            onChange={(e) => handleDateChange('end_date', e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="col-span-1 space-y-2 md:col-span-2">
                      <Label>Selected Dates</Label>
                      <div className="flex items-center gap-2 mb-2">
                        <Input 
                          type="date" 
                          id="multipleDateInput"
                        />
                        <Button type="button" onClick={() => {
                          const val = document.getElementById('multipleDateInput').value;
                          if (val) addSelectedDate(val);
                        }}>Add Date</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedDates.map(date => (
                          <Badge key={date} variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm">
                            {format(new Date(date), 'MMM d, yyyy')}
                            <XCircle className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSelectedDate(date)} />
                          </Badge>
                        ))}
                        {formData.selectedDates.length === 0 && <span className="text-sm text-slate-500">No dates added yet</span>}
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 space-y-2 md:col-span-2">
                    <Label>Total Days</Label>
                    <Input type="number" value={formData.total_days} disabled className="bg-slate-50" />
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
                {(requiresAttachment || formData.attachment_url) && (
                  <div className="space-y-2">
                    <Label>Supporting Document {requiresAttachment ? '* (Required)' : '(Optional)'}</Label>
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
                      {requiresAttachment && !formData.attachment_url && (
                        <span className="text-sm text-red-500">
                          Document is required for this request.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={createLeaveMutation.isPending} disabled={!hasRequiredRequestData || createLeaveMutation.isPending || logPastLeaveMutation.isPending}>
                    {createLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <PendingLeaveApprovals
          requests={pendingApprovals}
          onApprove={handleApprove}
          onReject={handleReject}
          isPending={updateLeaveMutation.isPending}
          safeDate={safeDate}
        />

        <MyLeaveRequests
          requests={myRequests}
          statusColors={statusColors}
          onCancel={handleCancel}
          safeDate={safeDate}
        />
      </div>
    </div>
  );
}
