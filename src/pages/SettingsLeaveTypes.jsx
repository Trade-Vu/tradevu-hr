import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi, approvalsApi, organizationsApi, employeesApi } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { isHrAdmin, isSuperAdmin } from '@/lib/roleUtils';
import { useLeaveTypes, LEAVE_TYPE_KEYS } from '@/hooks/useLeaveTypesQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  formatApprovalChain,
  normalizeApprovalSteps,
  DEFAULT_LEAVE_APPROVAL_STEPS,
  FULL_LEAVE_APPROVAL_FLOW,
} from '@/lib/approvalSteps';
import { toTitleCase } from '@/lib/utils';
import { normalizeEmploymentTypes, normalizeEmployeeClasses } from '@/lib/formOptions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Calendar, Clock, CheckCircle2, FileText } from 'lucide-react';
import LeaveTypeForm from '@/components/Leave/LeaveTypeForm';
import LeaveTypeCard from '@/components/Leave/LeaveTypeCard';

const DEFAULT_FORM_DATA = {
  name: '',
  code: '',
  daysPerYear: 10,
  isPaid: true,
  requiresApproval: true,
  requiresHandover: false,
  handoverRequirement: 'OPTIONAL',
  hasNoticePeriod: false,
  noticePeriodDays: 0,
  requiresAttachment: false,
  allowHalfDay: true,
  approvalMode: 'default',
  approvalSteps: DEFAULT_LEAVE_APPROVAL_STEPS,
  onlyConfirmed: false,
  employmentTypes: [],
  employeeClasses: [],
  daysExceptions: [],
};

export default function SettingsLeaveTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const { data: orgData } = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: async () => {
      const res = await organizationsApi.getMyOrganization();
      return res?.data || res;
    },
  });
  const employmentTypeOptions = normalizeEmploymentTypes(orgData?.employmentTypes);
  const employeeClassOptions = normalizeEmployeeClasses(orgData?.employeeClasses);

  const { data: rawEmployees = [] } = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: async () => {
      const res = await employeesApi.getAllEmployees();
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });
  const employees = (Array.isArray(rawEmployees) ? rawEmployees : []).map((emp) => ({
    id: String(emp._id || emp.id),
    fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
    email: emp.email,
    jobTitle: emp.jobTitle || emp.job_title || '',
  }));

  const { data: workflowData } = useQuery({
    queryKey: ['workflows'],
    queryFn: approvalsApi.getWorkflows,
  });
  const workflows = Array.isArray(workflowData) ? workflowData : workflowData?.data || [];
  const defaultLeaveWorkflow = workflows.find((workflow) => workflow.type === 'leave' && workflow.isActive !== false);
  const defaultChainLabel = defaultLeaveWorkflow?.levels?.length
    ? formatApprovalChain(defaultLeaveWorkflow.levels)
    : formatApprovalChain(DEFAULT_LEAVE_APPROVAL_STEPS);

  const { data: leaveTypes = [], isLoading } = useLeaveTypes();

  const { mutate: createLeaveType, isPending: isCreating } = useMutation({
    mutationFn: (variables) => leaveApi.createLeaveType(variables),
    onSuccess: () => {
      toast.success("Leave Type created successfully!");
      queryClient.invalidateQueries({ queryKey: LEAVE_TYPE_KEYS.all });
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.errors?.[0]?.message || err.message || "Failed to create leave type.");
    }
  });

  const { mutate: updateLeaveType, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, ...variables }) => leaveApi.updateLeaveType(id, variables),
    onSuccess: () => {
      toast.success("Leave Type updated successfully!");
      queryClient.invalidateQueries({ queryKey: LEAVE_TYPE_KEYS.all });
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.errors?.[0]?.message || err.message || "Failed to update leave type.");
    }
  });

  const isPending = isCreating || isUpdating;
  const canDeleteLeaveTypes = isSuperAdmin(user) || isHrAdmin(user);

  const { mutate: deleteLeaveType, isPending: isDeleting } = useMutation({
    mutationFn: (id) => leaveApi.deleteLeaveType(id),
    onSuccess: () => {
      toast.success('Leave Type deleted successfully!');
      queryClient.invalidateQueries({ queryKey: LEAVE_TYPE_KEYS.all });
      setLeaveTypeToDelete(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete leave type.');
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleEdit = (lt) => {
    const approvalSteps = normalizeApprovalSteps(lt.approvalSteps);
    const hasNotice = Boolean(lt.hasNoticePeriod || (lt.noticePeriodDays && lt.noticePeriodDays > 0) || (lt.noticeDaysRequired && lt.noticeDaysRequired > 0));
    const noticeDays = hasNotice ? (lt.noticePeriodDays ?? lt.noticeDaysRequired ?? 0) : 0;
    const requiresHandover = Boolean(lt.requiresHandover || lt.handoverRequirement === 'COMPULSORY');

    setFormData({
      name: lt.name,
      code: lt.code || '',
      daysPerYear: lt.defaultDays ?? lt.daysPerYear ?? 10,
      isPaid: lt.isPaid,
      requiresApproval: lt.requiresApproval,
      requiresHandover,
      handoverRequirement: requiresHandover ? 'COMPULSORY' : 'OPTIONAL',
      hasNoticePeriod: hasNotice,
      noticePeriodDays: noticeDays,
      requiresAttachment: lt.requiresAttachment ?? DEFAULT_FORM_DATA.requiresAttachment,
      allowHalfDay: lt.allowHalfDay ?? DEFAULT_FORM_DATA.allowHalfDay,
      approvalMode: approvalSteps.length > 0 ? 'custom' : 'default',
      approvalSteps: approvalSteps.length > 0 ? approvalSteps : DEFAULT_LEAVE_APPROVAL_STEPS,
      onlyConfirmed: Boolean(lt.onlyConfirmed),
      employmentTypes: Array.isArray(lt.employmentTypes) ? lt.employmentTypes : [],
      employeeClasses: Array.isArray(lt.employeeClasses) ? lt.employeeClasses : [],
      daysExceptions: Array.isArray(lt.daysExceptions) ? lt.daysExceptions : [],
    });
    setEditingId(lt.id || lt._id);
    setIsAdding(true);
  };

  const handleDelete = (lt) => {
    const leaveTypeId = lt.id || lt._id;
    if (!leaveTypeId) return;
    setLeaveTypeToDelete({ id: leaveTypeId, name: lt.name });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");
    
    const useCustomSteps = formData.requiresApproval && formData.approvalMode === 'custom';
    if (useCustomSteps && formData.approvalSteps.length === 0) {
      return toast.error('Add at least one approval step, or use the organization default.');
    }
    if (useCustomSteps) {
      const hasUnassignedOther = (formData.approvalSteps || []).some(
        (step) => String(step.role).toUpperCase() === 'OTHER' && !step.userId && !step.employeeId
      );
      if (hasUnassignedOther) {
        return toast.error('Please designate a specific employee for all approval steps marked "Other".');
      }
    }

    const noticeDays = formData.hasNoticePeriod ? Math.max(0, parseInt(formData.noticePeriodDays, 10) || 0) : 0;
    const isHandoverRequired = Boolean(formData.requiresHandover || formData.handoverRequirement === 'COMPULSORY');
    const defaultDaysVal = parseFloat(formData.daysPerYear) || 0;

    if (Array.isArray(formData.daysExceptions) && formData.daysExceptions.length > 0) {
      const invalidEx = formData.daysExceptions.find((ex) => {
        const d = Number(ex.days);
        return isNaN(d) || d < 0;
      });
      if (invalidEx) {
        const targetLabel = invalidEx.subjectName || invalidEx.subjectId || invalidEx.category || 'exception';
        return toast.error(
          `Exception days for "${targetLabel}" cannot be negative.`
        );
      }
    }

    const payload = {
      name: formData.name,
      code: formData.code || undefined,
      defaultDays: parseFloat(formData.daysPerYear) || 0,
      isPaid: formData.isPaid,
      requiresApproval: formData.requiresApproval,
      requiresHandover: isHandoverRequired,
      handoverRequirement: isHandoverRequired ? 'COMPULSORY' : 'OPTIONAL',
      hasNoticePeriod: Boolean(formData.hasNoticePeriod),
      noticePeriodDays: noticeDays,
      noticeDaysRequired: noticeDays,
      requiresAttachment: formData.requiresAttachment,
      allowHalfDay: formData.allowHalfDay,
      maxCarryOver: 0,
      approvalSteps: useCustomSteps ? normalizeApprovalSteps(formData.approvalSteps) : [],
      onlyConfirmed: Boolean(formData.onlyConfirmed),
      employmentTypes: Array.isArray(formData.employmentTypes) ? formData.employmentTypes : [],
      employeeClasses: Array.isArray(formData.employeeClasses) ? formData.employeeClasses : [],
      daysExceptions: Array.isArray(formData.daysExceptions) ? formData.daysExceptions : [],
    };

    if (editingId) {
      updateLeaveType({ id: editingId, ...payload });
    } else {
      createLeaveType(payload);
    }
  };

  const paidCount = leaveTypes.filter(lt => lt.isPaid).length;
  const noticeCount = leaveTypes.filter(lt => lt.hasNoticePeriod || (lt.noticePeriodDays > 0) || (lt.noticeDaysRequired > 0)).length;
  const handoverCount = leaveTypes.filter(lt => lt.requiresHandover || lt.handoverRequirement === 'COMPULSORY').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave Types</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure leave categories, quotas, advance notice periods, approval flows, and eligible employee groups.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Leave Type
        </Button>
      </div>

      {/* Summary Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{leaveTypes.length}</div>
            <div className="text-xs text-slate-500 font-medium">Configured Types</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{paidCount}</div>
            <div className="text-xs text-slate-500 font-medium">Paid Types</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{noticeCount}</div>
            <div className="text-xs text-slate-500 font-medium">Notice Required</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{handoverCount}</div>
            <div className="text-xs text-slate-500 font-medium">Handover Required</div>
          </div>
        </div>
      </div>

      {/* Grid of Leave Types */}
      {isLoading ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center text-slate-500">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mb-2" />
            <p className="text-sm">Loading leave types...</p>
          </CardContent>
        </Card>
      ) : leaveTypes.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 mb-1">No leave types configured</h4>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Create your organization's leave policies, quotas, and applicable workforce groups.
          </p>
          <Button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Create First Leave Type
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {leaveTypes.map((lt) => (
            <LeaveTypeCard
              key={lt.id || lt._id}
              leaveType={lt}
              defaultChainLabel={defaultChainLabel}
              canDelete={canDeleteLeaveTypes}
              isDeleting={isDeleting}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      <LeaveTypeForm
        isOpen={isAdding}
        onOpenChange={(open) => {
          if (!open) resetForm();
          else setIsAdding(true);
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        isPending={isPending}
        editingId={editingId}
        defaultChainLabel={defaultChainLabel}
        employmentTypeOptions={employmentTypeOptions}
        employeeClassOptions={employeeClassOptions}
        employees={employees}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!leaveTypeToDelete}
        onOpenChange={(open) => !open && setLeaveTypeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete leave type?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {leaveTypeToDelete?.name || 'this leave type'} and remove it from available leave types. Existing records will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteLeaveType(leaveTypeToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete leave type'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
