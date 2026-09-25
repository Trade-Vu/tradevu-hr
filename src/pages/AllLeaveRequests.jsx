import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi, approvalsApi } from "@/api";
import { useLeaveEligibleEmployees } from "@/hooks/useLeaveEligibleEmployeesQuery";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import { isPendingLeaveStatus, formatLeaveStatus, getLeaveStatusBadgeClass, normalizeLeaveStatus, LEAVE_STATUS } from "@/lib/leaveStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plane, Plus, CheckCircle, XCircle, Upload, Calendar, Edit, Clock, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { isSuperAdmin, isHrAdmin, isManager as checkIsManager } from "@/lib/roleUtils";
import { motion } from "framer-motion";
import { calculateWorkingDays } from "@/lib/leaveDays";
import LeaveActionDialog from "@/components/Leave/LeaveActionDialog";

const StatsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {Array(3).fill(0).map((_, i) => (
      <div key={i} className="p-6 bg-white border shadow-sm border-slate-100 rounded-2xl animate-pulse">
        <div className="w-12 h-12 mb-4 bg-slate-100 rounded-xl"></div>
        <div className="w-16 h-8 mb-2 rounded bg-slate-100"></div>
        <div className="w-24 h-4 rounded bg-slate-100"></div>
      </div>
    ))}
  </div>
);

const RequestsSkeleton = () => (
  <div className="space-y-4">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="flex items-start justify-between p-5 bg-white border shadow-sm border-slate-100 rounded-2xl animate-pulse">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-slate-100"></div>
            <div className="w-24 h-3 rounded bg-slate-100"></div>
            <div className="w-48 h-3 mt-2 rounded bg-slate-100"></div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="w-20 h-6 rounded-full bg-slate-100"></div>
          <div className="flex gap-2 mt-2">
            <div className="w-20 h-8 rounded-md bg-slate-100"></div>
            <div className="w-20 h-8 rounded-md bg-slate-100"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function AllLeaveRequests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperOrHrAdmin = isSuperAdmin(user) || isHrAdmin(user);
  const isManagerOnly = checkIsManager(user) && !isSuperOrHrAdmin;
  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    attachment_url: '',
    isHalfDay: false,
    useMultipleDates: false,
    selectedDates: [],
  });
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data: leaveRequestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['leave-requests', page, limit],
    queryFn: async () => {
      const payload = await leaveApi.getAllRequests({ page, limit });
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      return {
        data: list,
        total: payload?.pagination?.total ?? list.length,
        totalPages: Math.max(1, payload?.pagination?.totalPages ?? Math.ceil(list.length / limit)),
        currentPage: page,
        leaveRequests: list.map(l => ({
          ...l,
          id: l._id || l.id,
          employee_name: l.employeeId?.fullName || l.employeeId || 'Employee',
          employee_email: l.employeeId?.email || l.employee_email || '',
          leave_type: l.leaveTypeId?.name || 'Annual Leave',
          start_date: l.startDate || l.start_date,
          end_date: l.endDate || l.end_date,
          total_days: l.totalDays || l.total_days || 0,
          isHalfDay: !!l.isHalfDay,
          selectedDates: l.selectedDates || [],
          approvers: l.approvers || [],
          isAnnualPlan: Boolean(l.isAnnualPlan || l.leavePlanId),
        }))
      };
    },
  });

  const { data: leaveTypes = [] } = useLeaveTypes();

  // Default the picker to a real leave type id (it used to default to the string 'annual',
  // which isn't an id, so a request submitted without touching the picker failed).
  useEffect(() => {
    if (leaveTypes.length > 0 && !formData.leave_type) {
      setFormData(prev => ({ ...prev, leave_type: leaveTypes[0].id }));
    }
  }, [leaveTypes, formData.leave_type]);

  // Only onboarded, still-employed staff can have leave filed for them.
  const { data: employees = [] } = useLeaveEligibleEmployees();

  const createAuditLog = async (action, entityId, entityName, changes = {}) => {
    // Mocked for now
  };

  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const start = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[0] : data.start_date;
      const end = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[data.selectedDates.length - 1] : data.end_date;

      const leave = await leaveApi.createRequest({
        employeeId: data.employee_id,
        leaveTypeId: data.leave_type,
        startDate: new Date(start || new Date()).toISOString(),
        endDate: new Date(end || new Date()).toISOString(),
        reason: data.reason,
        attachmentUrl: data.attachment_url,
        isHalfDay: !!data.isHalfDay,
      });

      await createAuditLog('create', leave?._id || leave?.id, data.employee_id, { after: leave });
      return leave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowForm(false);
      setEditingLeave(null);
      setFormData({
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        total_days: 0,
        reason: '',
        attachment_url: '',
        isHalfDay: false,
        useMultipleDates: false,
        selectedDates: [],
      });
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Failed to create leave request."));
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const updated = data.status === 'approved'
        ? await approvalsApi.approveLeave(id)
        : await approvalsApi.rejectLeave(id, data.reason || 'Rejected by HR');

      await createAuditLog('update', id, oldData?.employee_name, {
        before: oldData,
        after: updated,
        fields_changed: Object.keys(data)
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      isHalfDay: leave.isHalfDay || false,
      useMultipleDates: leave.selectedDates?.length > 0,
      selectedDates: leave.selectedDates || [],
    });
    setShowForm(true);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload document to cloud storage.");
      }
      setFormData(prev => ({ ...prev, attachment_url: uploadResult.secure_url }));
    } catch (error) {
      console.error("Error uploading:", error);
    }
    setUploadingDoc(false);
  };
  const { data: publicHolidays = [] } = useQuery({
    queryKey: ['publicHolidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  useEffect(() => {
    if (formData.useMultipleDates) return;
    if (formData.start_date && formData.end_date) {
      const days = calculateWorkingDays(formData.start_date, formData.end_date, publicHolidays);
      setFormData(prev => ({ ...prev, total_days: prev.isHalfDay ? (days > 0 ? days * 0.5 : 0) : (days > 0 ? days : 0) }));
    } else {
      setFormData(prev => ({ ...prev, total_days: 0 }));
    }
  }, [formData.start_date, formData.end_date, formData.isHalfDay, formData.useMultipleDates, publicHolidays]);

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

  const handleApprove = async (leave) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: { status: 'approved' },
      oldData: leave
    });
  };

  const handleReject = async (leave, reason) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: { status: 'rejected', reason },
      oldData: leave
    });
  };

  const [confirmState, setConfirmState] = useState(null); // { leave, action }
  const handleConfirmLeaveAction = (reason) => {
    if (!confirmState) return;
    if (confirmState.action === 'approve') handleApprove(confirmState.leave);
    else handleReject(confirmState.leave, reason);
  };

  const displayRequests = leaveRequestsData?.leaveRequests || [];
  const totalRequests = leaveRequestsData?.total || 0;
  const totalPages = leaveRequestsData?.totalPages || 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 md:p-8"
    >
      <div className="mx-auto space-y-8 max-w-7xl">
        <motion.div variants={itemVariants} className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
              <Plane className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold tracking-wider text-indigo-700 uppercase">Leave Management</span>
            </div>
            
            <p className="text-slate-500">Manage and approve employee time off</p>
          </div>
          <Dialog open={showForm} onOpenChange={(open) => {
            setShowForm(open);
            if (!open) {
              setEditingLeave(null);
              setFormData({
                employee_id: '',
                leave_type: '',
                start_date: '',
                end_date: '',
                total_days: 0,
                reason: '',
                attachment_url: '',
                isHalfDay: false,
                useMultipleDates: false,
                selectedDates: [],
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl shadow-xl rounded-2xl border-slate-100">
              <DialogHeader>
                <DialogTitle>{editingLeave ? 'Edit' : 'Create'} Leave Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingLeave) {
                  updateLeaveMutation.mutate({ id: editingLeave.id, data: formData, oldData: editingLeave });
                } else {
                  if (!formData.employee_id) {
                    toast.error('Select the employee this leave request is for.');
                    return;
                  }
                  if (!formData.leave_type) {
                    toast.error('Select a leave type.');
                    return;
                  }
                  createLeaveMutation.mutate(formData);
                }
              }} className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))} disabled={!!editingLeave}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent className="shadow-lg rounded-xl border-slate-100">
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
                      <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent className="shadow-lg rounded-xl border-slate-100">
                        {leaveTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                          tDays = formData.selectedDates.reduce((total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays), 0) * (isHalf ? 0.5 : 1);
                        } else if (formData.start_date && newEndDate) {
                          tDays = calculateWorkingDays(formData.start_date, newEndDate, publicHolidays) * (isHalf ? 0.5 : 1);
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
                          tDays = formData.selectedDates.reduce((total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays), 0) * (formData.isHalfDay ? 0.5 : 1);
                        } else if (formData.start_date && formData.end_date) {
                          tDays = calculateWorkingDays(formData.start_date, formData.end_date, publicHolidays) * (formData.isHalfDay ? 0.5 : 1);
                        }
                        setFormData({ ...formData, useMultipleDates: useMultiple, total_days: tDays });
                      }} 
                      className="rounded border-slate-300"
                    />
                    <Label htmlFor="useMultipleDates">Multiple Dates</Label>
                  </div>
                </div>

                {!formData.useMultipleDates ? (
                  <div className={`grid gap-4 ${!formData.isHalfDay ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={formData.start_date} onChange={(e) => {
                        const start = e.target.value;
                        const end = formData.isHalfDay ? start : formData.end_date;
                        setFormData(prev => ({ ...prev, start_date: start, end_date: end }));
                      }} className="rounded-lg" required />
                    </div>
                    {!formData.isHalfDay && (
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="rounded-lg" required />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Selected Dates</Label>
                    <div className="flex items-center gap-2 mb-2">
                      <Input type="date" id="multipleDateInput" />
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
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Total Days</Label>
                  <Input type="number" value={formData.total_days} readOnly className="rounded-lg bg-slate-50 text-slate-500" />
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={formData.reason} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} className="rounded-lg" rows={3} required />
                </div>

                <div className="space-y-2">
                  <Label>Supporting Document (Optional)</Label>
                  <input type="file" onChange={handleDocUpload} className="hidden" id="leave-doc" />
                  <Button type="button" variant="outline" className="w-full border-dashed rounded-lg border-slate-300 hover:border-indigo-300 hover:bg-indigo-50" onClick={() => document.getElementById('leave-doc').click()} disabled={uploadingDoc}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingDoc ? 'Uploading...' : formData.attachment_url ? 'Document Uploaded ✓' : 'Upload Document'}
                  </Button>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 rounded-lg hover:bg-indigo-700" isLoading={createLeaveMutation.isPending || updateLeaveMutation.isPending}>
                    {(createLeaveMutation.isPending || updateLeaveMutation.isPending) ? 'Saving...' : editingLeave ? 'Update Request' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {loadingRequests ? (
          <StatsSkeleton />
        ) : (
          <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-amber-50"></div>
              <CardContent className="relative z-10 p-6">
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-amber-100/50 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {displayRequests.filter(l => isPendingLeaveStatus(l.status)).length}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">Pending Approvals</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-emerald-50"></div>
              <CardContent className="relative z-10 p-6">
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-emerald-100/50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {displayRequests.filter(l => normalizeLeaveStatus(l.status) === LEAVE_STATUS.APPROVED).length}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">Approved This Month</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white shadow-sm border-slate-200/60 rounded-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 -mt-4 -mr-4 rounded-bl-full opacity-50 pointer-events-none bg-indigo-50"></div>
              <CardContent className="relative z-10 p-6">
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-indigo-100/50 rounded-xl">
                  <Plane className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-slate-900">{displayRequests.length}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Total Requests</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200/60">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">All leave requests</h2>
            </div>
            
            <div className="p-6">
              {loadingRequests ? (
                <RequestsSkeleton />
              ) : displayRequests.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 border bg-slate-50 border-slate-100 rounded-2xl">
                    <Plane className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-slate-900">No leave requests</h3>
                  <p className="max-w-sm text-slate-500">When employees submit time off requests, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayRequests.map((leave, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={leave.id} 
                      className="p-5 transition-all bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md rounded-2xl group"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="flex items-start flex-1 gap-4">
                          <div className="flex items-center justify-center w-12 h-12 border border-indigo-100 rounded-full bg-indigo-50 shrink-0">
                            <span className="text-lg font-bold text-indigo-700">
                              {leave.employee_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900">{leave.employee_name}</h3>
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-slate-200 text-slate-600">
                                {leave.leave_type.replace('_', ' ')}
                              </Badge>
                              {leave.isAnnualPlan && (
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-indigo-200 text-indigo-700 bg-indigo-50">
                                  Annual Plan
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {leave.selectedDates && leave.selectedDates.length > 0
                                ? <span>{leave.selectedDates.map(d => format(new Date(d), 'MMM dd')).join(', ')}</span>
                                : <>
                                    <span>{format(new Date(leave.start_date), 'MMM dd, yyyy')}</span>
                                    <span className="text-slate-300">-</span>
                                    <span>{format(new Date(leave.end_date), 'MMM dd, yyyy')}</span>
                                  </>
                              }
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-xs ml-1">
                                {leave.total_days} day{leave.total_days !== 1 ? 's' : ''} {leave.isHalfDay && <Badge variant="secondary" className="ml-1 text-[10px]">Half Day</Badge>}
                              </span>
                            </div>
                            <p className="p-3 text-sm border text-slate-600 bg-slate-50/80 rounded-xl border-slate-100">
                              "{leave.reason}"
                            </p>
                            {leave.attachment_url && (
                              <div className="mt-3">
                                <a 
                                  href={leave.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                >
                                  <Paperclip className="w-4 h-4" /> View Attachment
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-row items-center justify-between gap-3 pl-16 md:flex-col md:items-end md:justify-start md:pl-0">
                          <Badge className={`${getLeaveStatusBadgeClass(leave.status)} border font-semibold px-2.5 py-0.5 rounded-full shadow-sm`}>
                            {formatLeaveStatus(leave.status)}
                          </Badge>

                          {isPendingLeaveStatus(leave.status) && (() => {
                            const hasManagerApproved = Boolean(
                              (leave.approvers || leave.approvalHistory || []).some(
                                (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
                              ) ||
                              ((leave.currentApprovalLevel || 0) > 0 && Array.isArray(leave.approvalLevels) && leave.approvalLevels[0]?.role === 'MANAGER')
                            );

                            if (hasManagerApproved && isManagerOnly) {
                              return (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Approved by Manager</span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-8 h-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" 
                                  onClick={() => handleEdit(leave)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => setConfirmState({ leave, action: 'approve' })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => setConfirmState({ leave, action: 'reject' })}
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" />
                                  Reject
                                </Button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex items-center justify-between px-2 mt-6">
                    <p className="text-sm font-medium text-slate-500">
                      Showing <span className="font-semibold text-slate-900">{((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * limit, totalRequests)}</span> of <span className="font-semibold text-slate-900">{totalRequests}</span> requests
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg shadow-sm border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0}
                        className="rounded-lg shadow-sm border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <LeaveActionDialog
        open={!!confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
        action={confirmState?.action}
        employeeName={confirmState?.leave?.employee_name}
        isPending={updateLeaveMutation.isPending}
        onConfirm={handleConfirmLeaveAction}
      />
    </motion.div>
  );
}