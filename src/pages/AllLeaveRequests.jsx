import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi, approvalsApi } from "@/api";
import { useLeaveEligibleEmployees } from "@/hooks/useLeaveEligibleEmployeesQuery";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plane, Plus } from "lucide-react";
import { isSuperAdmin, isHrAdmin, isManager as checkIsManager } from "@/lib/roleUtils";
import { motion } from "framer-motion";
import LeaveActionDialog from "@/components/Leave/LeaveActionDialog";
import LeaveStatsCards from "@/components/Leave/LeaveStatsCards";
import LeaveRequestsList from "@/components/Leave/LeaveRequestsList";
import LeaveRequestDialog from "@/components/Leave/LeaveRequestDialog";

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

export default function AllLeaveRequests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperOrHrAdmin = isSuperAdmin(user) || isHrAdmin(user);
  const isManagerOnly = checkIsManager(user) && !isSuperOrHrAdmin;

  const [showForm, setShowForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { leave, action }
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
          employee_name: l.employeeId?.fullName || l.employeeId?.name || l.employee_name || 'Employee',
          employee_email: l.employeeId?.email || l.employee_email || '',
          department_name: l.employeeId?.departmentId?.name || l.employeeId?.department?.name || l.department_name || '',
          leave_type: l.leaveTypeId?.name || 'Annual Leave',
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
          approvers: l.approvers || [],
          isAnnualPlan: Boolean(l.isAnnualPlan || l.leavePlanId),
          isPastLeave: Boolean(l.isPastLeave),
        }))
      };
    },
  });

  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: employees = [] } = useLeaveEligibleEmployees();

  const { data: publicHolidays = [] } = useQuery({
    queryKey: ['publicHolidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const invalidateLeaveQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const createLeaveMutation = useMutation({
    mutationFn: async (data) => {
      const start = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[0] : data.start_date;
      const end = data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates[data.selectedDates.length - 1] : data.end_date;

      return leaveApi.createRequest({
        employeeId: data.employee_id,
        leaveTypeId: data.leave_type,
        startDate: new Date(start || new Date()).toISOString(),
        endDate: new Date(end || new Date()).toISOString(),
        reason: data.reason,
        attachmentUrl: data.attachment_url,
        handoverNote: data.handover_note,
        handoverNoteUrl: data.handover_note_url,
        reliefOfficerId: data.relief_officer_id || undefined,
        isHalfDay: !!data.isHalfDay,
        selectedDates: data.useMultipleDates && data.selectedDates.length > 0 ? data.selectedDates : undefined,
      });
    },
    onSuccess: () => {
      invalidateLeaveQueries();
      setShowForm(false);
      setEditingLeave(null);
      toast.success("Leave request submitted successfully.");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Failed to create leave request."));
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      return data.status === 'approved'
        ? await approvalsApi.approveLeave(id)
        : await approvalsApi.rejectLeave(id, data.reason || 'Rejected by HR');
    },
    onSuccess: () => {
      invalidateLeaveQueries();
      setEditingLeave(null);
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Failed to update leave request."));
    }
  });

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setShowForm(true);
  };

  const handleFormSubmit = (formData, currentEditingLeave) => {
    if (currentEditingLeave) {
      updateLeaveMutation.mutate({ id: currentEditingLeave.id, data: formData, oldData: currentEditingLeave });
    } else {
      createLeaveMutation.mutate(formData);
    }
  };

  const handleApprove = (leave) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: { status: 'approved' },
      oldData: leave
    });
  };

  const handleReject = (leave, reason) => {
    updateLeaveMutation.mutate({
      id: leave.id,
      data: { status: 'rejected', reason },
      oldData: leave
    });
  };

  const handleConfirmLeaveAction = (reason) => {
    if (!confirmState) return;
    if (confirmState.action === 'approve') {
      handleApprove(confirmState.leave);
    } else {
      handleReject(confirmState.leave, reason);
    }
  };

  const displayRequests = leaveRequestsData?.leaveRequests || [];
  const totalRequests = leaveRequestsData?.total || 0;
  const totalPages = leaveRequestsData?.totalPages || 1;

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

          {/* <Button
            onClick={() => {
              setEditingLeave(null);
              setShowForm(true);
            }}
            className="text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button> */}
        </motion.div>

        <LeaveStatsCards
          requests={displayRequests}
          isLoading={loadingRequests}
          itemVariants={itemVariants}
        />

        <LeaveRequestsList
          requests={displayRequests}
          isLoading={loadingRequests}
          isManagerOnly={isManagerOnly}
          page={page}
          limit={limit}
          totalRequests={totalRequests}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={handleEdit}
          onRequestAction={(leave, action) => setConfirmState({ leave, action })}
          itemVariants={itemVariants}
        />
      </div>

      <LeaveRequestDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingLeave(null);
        }}
        editingLeave={editingLeave}
        employees={employees}
        leaveTypes={leaveTypes}
        publicHolidays={publicHolidays}
        onSubmit={handleFormSubmit}
        isSubmitting={createLeaveMutation.isPending || updateLeaveMutation.isPending}
      />

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