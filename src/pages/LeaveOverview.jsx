import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { filterApplicableLeaveTypes } from "@/components/Leave/leaveEligibilityUtils";
import { leaveApi, approvalsApi } from "@/api";
import { useLeaveEligibleEmployees } from "@/hooks/useLeaveEligibleEmployeesQuery";
import { isLeaveEligibleStatus, isSeparatedStatus } from "@/lib/employmentStatus";
import { isSuperAdmin, isHrAdmin, isManager as checkIsManager, isInAdminMode } from "@/lib/roleUtils";
import { isPendingLeaveStatus } from "@/lib/leaveStatus";
import { Button } from "@/components/ui/button";
import { Plane, Plus } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage, getRefId } from "@/lib/utils";

import LeaveBalances from "@/components/Leave/LeaveBalances";
import LeaveOverviewFormCard from "@/components/Leave/LeaveOverviewFormCard";
import ReliefHandoverConfirmations from "@/components/Leave/ReliefHandoverConfirmations";
import PendingLeaveApprovals from "@/components/Leave/PendingLeaveApprovals";
import MyLeaveRequests from "@/components/Leave/MyLeaveRequests";

export default function LeaveOverview() {
  const queryClient = useQueryClient();
  const { user, refreshUser, viewMode } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isPastLeave, setIsPastLeave] = useState(false);

  // When in Employee view mode, HR Admin is strictly limited to regular employee access.
  const isAdmin = isInAdminMode(user, viewMode);
  const isManager = checkIsManager(user);
  const selfEmploymentStatus = user?.employeeId?.employmentStatus;
  const canRequestForSelf = !selfEmploymentStatus || isLeaveEligibleStatus(selfEmploymentStatus);

  useEffect(() => {
    if (!canRequestForSelf) refreshUser();
  }, []);

  const { data: rawLeaveTypes = [] } = useLeaveTypes();
  const leaveTypes = useMemo(() => {
    if (isAdmin) return rawLeaveTypes;
    if (!canRequestForSelf) return [];
    return filterApplicableLeaveTypes(rawLeaveTypes, user?.employeeId);
  }, [isAdmin, canRequestForSelf, rawLeaveTypes, user?.employeeId]);

  const { data: employees = [] } = useLeaveEligibleEmployees();

  const { data: publicHolidays = [] } = useQuery({
    queryKey: ['publicHolidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const activeEmployeeId = getRefId(user?.employeeId);

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leave-requests', isAdmin, isManager],
    queryFn: async () => {
      const payload = isAdmin || isManager
        ? await leaveApi.getAllRequests({ page: 1, limit: 100 })
        : await leaveApi.getMyRequests({ page: 1, limit: 100 });

      const list = Array.isArray(payload) ? payload : payload?.data || [];
      return list.map(l => {
        const emp = l.employeeId || {};
        const typeName = l.leaveTypeId?.name || l.leaveType?.name || 'Annual Leave';

        return {
          ...l,
          id: l._id || l.id,
          employee_email: emp.email || l.employee_email || (typeof emp === 'string' ? emp : ''),
          employee_name: emp.fullName || l.employee_name || (typeof emp === 'string' ? emp : 'Employee'),
          department_name: emp.departmentId?.name || emp.department?.name || l.department_name || '',
          leave_type: typeName,
          start_date: l.startDate || l.start_date,
          end_date: l.endDate || l.end_date,
          total_days: l.totalDays || l.total_days || 0,
          isHalfDay: !!l.isHalfDay,
          selectedDates: l.selectedDates || [],
          attachment_url: l.attachmentUrl || l.attachment_url || '',
          handover_note: l.handoverNote || l.handover_note || '',
          handover_note_url: l.handoverNoteUrl || l.handover_note_url || '',
          relief_officer_id: l.reliefOfficerId?._id || l.reliefOfficerId?.id || l.reliefOfficerId || '',
          relief_officer_name: l.reliefOfficerId?.fullName || l.reliefOfficerId?.name || '',
          relief_officer_status: l.reliefOfficerStatus || 'PENDING',
          relief_officer_comments: l.reliefOfficerComments || '',
          approvers: l.approvers || [],
          isAnnualPlan: Boolean(l.isAnnualPlan || l.leavePlanId),
          isPastLeave: Boolean(l.isPastLeave),
        };
      });
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: reliefRequests = [] } = useQuery({
    queryKey: ['relief-requests'],
    queryFn: async () => {
      const res = await leaveApi.getReliefRequests();
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: !!user,
  });

  const confirmReliefMutation = useMutation({
    mutationFn: async ({ id, action, comments }) => {
      return leaveApi.confirmReliefHandover(id, { action, comments });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'CONFIRMED' ? 'Handover note confirmed successfully!' : 'Handover confirmation declined.');
      queryClient.invalidateQueries({ queryKey: ['relief-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update handover confirmation.'));
    }
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

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      if (status === 'APPROVED') {
        return approvalsApi.approveLeave(id);
      } else if (status === 'REJECTED') {
        return approvalsApi.rejectLeave(id, reason || 'Rejected by reviewer');
      } else if (status === 'CANCELLED') {
        return leaveApi.cancelRequest(id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      let actionText = 'updated';
      if (variables.status === 'APPROVED') actionText = 'approved';
      if (variables.status === 'REJECTED') actionText = 'rejected';
      if (variables.status === 'CANCELLED') actionText = 'cancelled';
      
      toast.success(`Leave request successfully ${actionText}`);
    },
    onError: (error) => {
      console.error(error);
      toast.error(extractErrorMessage(error, "Failed to update leave request."));
    }
  });

  const handleApprove = (request) => {
    updateLeaveMutation.mutate({ id: request.id, status: 'APPROVED' });
  };

  const handleReject = (request, reason) => {
    updateLeaveMutation.mutate({ id: request.id, status: 'REJECTED', reason });
  };

  const handleCancel = (request) => {
    updateLeaveMutation.mutate({ id: request.id, status: 'CANCELLED' });
  };

  const safeDate = (val) => {
    if (!val) return new Date();
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    const num = Number(val);
    if (!isNaN(num)) return new Date(num);
    return new Date();
  };

  const myRequests = leaveRequests.filter(r => r.employee_email === user?.email);
  const pendingApprovals = leaveRequests.filter(r => {
    if (r.employee_email === user?.email) return false;
    if (!isPendingLeaveStatus(r.status)) return false;
    if (isManager && !isAdmin) {
      const hasManagerApproved = (r.approvers || r.approvalHistory || []).some(
        (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
      );
      if (hasManagerApproved) return false;
    }
    return isAdmin || isManager;
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    refetchBalances();
    setShowForm(false);
    setIsPastLeave(false);
  };

  return (
    <div className="min-h-screen">
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

          {leaveTypes.length > 0 && !isAdmin && !canRequestForSelf && (
            <p className="max-w-xs text-sm text-slate-500">
              {isSeparatedStatus(selfEmploymentStatus)
                ? 'Leave requests are not available for former employees.'
                : "You'll be able to request leave once your onboarding is complete."}
            </p>
          )}

          {leaveTypes.length > 0 && (isAdmin || canRequestForSelf) && (
            <div className="flex gap-2">
              <Button 
                onClick={() => { setShowForm(true); setIsPastLeave(true); }}
                variant="outline"
              >
                Log Past Leave
              </Button>
              <Button 
                onClick={() => { setShowForm(true); setIsPastLeave(false); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Leave Request
              </Button>
            </div>
          )}
        </div>

        <LeaveBalances leaveBalances={leaveBalances} leaveTypes={leaveTypes} isAdmin={isAdmin} />

        {/* Request Form Modal */}
        <LeaveOverviewFormCard
          isOpen={showForm}
          user={user}
          isAdmin={isAdmin}
          isPastLeave={isPastLeave}
          employees={employees}
          leaveTypes={leaveTypes}
          leaveBalances={leaveBalances}
          publicHolidays={publicHolidays}
          onClose={() => { setShowForm(false); setIsPastLeave(false); }}
          onSuccess={handleFormSuccess}
        />

        <ReliefHandoverConfirmations
          requests={reliefRequests}
          onConfirm={confirmReliefMutation.mutate}
          isPending={confirmReliefMutation.isPending}
          safeDate={safeDate}
        />

        <PendingLeaveApprovals
          requests={pendingApprovals}
          onApprove={handleApprove}
          onReject={handleReject}
          isPending={updateLeaveMutation.isPending}
          safeDate={safeDate}
        />

        <MyLeaveRequests
          requests={myRequests}
          onCancel={handleCancel}
          safeDate={safeDate}
        />
      </div>
    </div>
  );
}
