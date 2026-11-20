import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi, approvalsApi, employeesApi } from "@/api";
import { useLeaveEligibleEmployees } from "@/hooks/useLeaveEligibleEmployeesQuery";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { toast } from "sonner";
import { extractErrorMessage, getRefId } from "@/lib/utils";
import { isPendingLeaveStatus } from "@/lib/leaveStatus";
import { Button } from "@/components/ui/button";
import { Plane, Plus } from "lucide-react";
import { isSuperAdmin, isHrAdmin, isManager as checkIsManager } from "@/lib/roleUtils";
import { motion } from "framer-motion";
import LeaveActionDialog from "@/components/Leave/LeaveActionDialog";
import LeaveStatsCards from "@/components/Leave/LeaveStatsCards";
import LeaveRequestsList from "@/components/Leave/LeaveRequestsList";
import LeaveRequestDialog from "@/components/Leave/LeaveRequestDialog";
import { getLeaveEmployeeName, getLeaveDepartmentName } from "@/components/Leave/leaveEmployeeUtils";

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

  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: employees = [] } = useLeaveEligibleEmployees();

  // Org-wide employees directory for resolving employee names on all leave records
  const { data: allEmployees = [] } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: async () => {
      const res = await employeesApi.getAllEmployees();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  const employeesMap = useMemo(() => {
    const map = new Map();
    [...employees, ...allEmployees].forEach((emp) => {
      const id = emp.id || emp._id;
      if (id) {
        map.set(String(id), emp);
      }
      if (emp.email) {
        map.set(String(emp.email).toLowerCase(), emp);
      }
    });
    return map;
  }, [employees, allEmployees]);

  const normalizeLeave = (l) => {
    const rawEmp = l.employeeId || l.employee;
    const empId = typeof rawEmp === 'string' ? rawEmp : (rawEmp?._id || rawEmp?.id || l.employee_id);
    const empEmail = (typeof rawEmp === 'object' && rawEmp?.email) || l.employee_email;
    const matchedEmp =
      (empId ? employeesMap.get(String(empId)) : null) ||
      (empEmail ? employeesMap.get(String(empEmail).toLowerCase()) : null);

    const resolvedName =
      (typeof rawEmp === 'object' &&
        (rawEmp?.fullName ||
          rawEmp?.full_name ||
          rawEmp?.name ||
          (rawEmp?.firstName && rawEmp?.lastName ? `${rawEmp.firstName} ${rawEmp.lastName}` : null) ||
          (rawEmp?.first_name && rawEmp?.last_name ? `${rawEmp.first_name} ${rawEmp.last_name}` : null) ||
          rawEmp?.user?.fullName ||
          rawEmp?.user?.full_name ||
          rawEmp?.user?.name)) ||
      matchedEmp?.fullName ||
      matchedEmp?.full_name ||
      matchedEmp?.name ||
      (matchedEmp?.firstName && matchedEmp?.lastName ? `${matchedEmp.firstName} ${matchedEmp.lastName}` : null) ||
      (matchedEmp?.first_name && matchedEmp?.last_name ? `${matchedEmp.first_name} ${matchedEmp.last_name}` : null) ||
      (l.employee_name && l.employee_name !== 'Employee' ? l.employee_name : null) ||
      (l.employeeName && l.employeeName !== 'Employee' ? l.employeeName : null) ||
      (empEmail && typeof empEmail === 'string' && empEmail.includes('@')
        ? empEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : null) ||
      'Employee';

    const resolvedEmail = empEmail || matchedEmp?.email || '';

    const resolvedDept =
      (typeof rawEmp === 'object' &&
        (rawEmp?.departmentId?.name || rawEmp?.department?.name || rawEmp?.department)) ||
      matchedEmp?.departmentId?.name ||
      matchedEmp?.department?.name ||
      matchedEmp?.department ||
      l.department_name ||
      '';

    const typeName = l.leaveTypeId?.name || l.leaveType?.name || l.leave_type || 'Annual Leave';

    return {
      ...l,
      id: l._id || l.id,
      employee_name: resolvedName,
      employee_email: resolvedEmail,
      department_name: resolvedDept,
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
      approvers: l.approvers || [],
      isAnnualPlan: Boolean(l.isAnnualPlan || l.leavePlanId),
      isPastLeave: Boolean(l.isPastLeave),
    };
  };

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
      };
    },
  });

  // Query pending approvals queue so managers can see and act on cross-department direct reports
  const { data: pendingApprovalsData, isLoading: loadingPending } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => await approvalsApi.getPendingApprovals(),
    enabled: !!user,
  });

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
    queryClient.refetchQueries({ queryKey: ['pendingApprovals'] });
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
    onSuccess: (_, variables) => {
      invalidateLeaveQueries();
      setEditingLeave(null);
      setShowForm(false);
      setConfirmState(null);
      const actionText = variables.data?.status === 'approved' ? 'approved' : 'rejected';
      toast.success(`Leave request ${actionText} successfully.`);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, "Failed to update leave request."));
    }
  });

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setShowForm(true);
  };

  const isOwnRequest = (leave) => {
    const requestEmployeeId = getRefId(leave.employeeId) || getRefId(leave.employee_id) || getRefId(leave.employee);
    const currentEmployeeId = getRefId(user?.employeeId) || getRefId(user?.employee);
    const requestEmail = String(leave.employee_email || leave.employeeId?.email || leave.employee?.email || '').toLowerCase();
    const currentEmail = String(user?.email || '').toLowerCase();

    return Boolean(
      (requestEmployeeId && currentEmployeeId && requestEmployeeId === currentEmployeeId) ||
      (requestEmail && currentEmail && requestEmail === currentEmail)
    );
  };

  const handleFormSubmit = (formData, currentEditingLeave) => {
    if (currentEditingLeave) {
      updateLeaveMutation.mutate({ id: currentEditingLeave.id, data: formData, oldData: currentEditingLeave });
    } else {
      createLeaveMutation.mutate(formData);
    }
  };

  const handleApprove = (leave) => {
    if (isOwnRequest(leave)) {
      toast.error('You cannot approve your own leave request.');
      return;
    }
    updateLeaveMutation.mutate({
      id: leave.id || leave._id,
      data: { status: 'approved' },
      oldData: leave
    });
  };

  const handleReject = (leave, reason) => {
    if (isOwnRequest(leave)) {
      toast.error('You cannot reject your own leave request.');
      return;
    }
    updateLeaveMutation.mutate({
      id: leave.id || leave._id,
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

  // Pending leaves awaiting this manager's decision (including cross-department direct reports)
  const pendingLeaves = useMemo(() => {
    const rawLeaves = pendingApprovalsData?.leaveRequests || [];
    return rawLeaves
      .filter((l) => !isOwnRequest(l) && isPendingLeaveStatus(l.status))
      .map(normalizeLeave);
  }, [pendingApprovalsData?.leaveRequests, employeesMap, user]);

  // Merge pending approvals and historical requests for a unified, comprehensive view
  const displayRequests = useMemo(() => {
    const rawBase = leaveRequestsData?.data || [];
    const map = new Map();

    // Ensure pending approval leaves appear first so they are visible and actionable
    pendingLeaves.forEach((leave) => {
      const id = leave.id || leave._id;
      if (id) map.set(id, leave);
    });

    rawBase
      .map(normalizeLeave)
      .forEach((leave) => {
        const id = leave.id || leave._id;
        if (id && !map.has(id)) {
          map.set(id, leave);
        } else if (id && map.has(id)) {
          map.set(id, { ...map.get(id), ...leave });
        }
      });

    return Array.from(map.values());
  }, [pendingLeaves, leaveRequestsData?.data, employeesMap]);

  const totalRequests = Math.max(displayRequests.length, leaveRequestsData?.total || 0);
  const totalPages = Math.max(1, leaveRequestsData?.totalPages || Math.ceil(totalRequests / limit));

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen p-4"
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
        </motion.div>

        <LeaveStatsCards
          requests={displayRequests}
          isLoading={loadingRequests || loadingPending}
          itemVariants={itemVariants}
        />

        <LeaveRequestsList
          requests={displayRequests}
          isLoading={loadingRequests || loadingPending}
          isManagerOnly={isManagerOnly}
          page={page}
          limit={limit}
          totalRequests={totalRequests}
          totalPages={totalPages}
          onPageChange={setPage}
          onEdit={handleEdit}
          onRequestAction={(leave, action) => setConfirmState({ leave, action })}
          canTakeAction={(leave) => !isOwnRequest(leave)}
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
        employeeName={getLeaveEmployeeName(confirmState?.leave)}
        isPending={updateLeaveMutation.isPending}
        onConfirm={handleConfirmLeaveAction}
      />
    </motion.div>
  );
}