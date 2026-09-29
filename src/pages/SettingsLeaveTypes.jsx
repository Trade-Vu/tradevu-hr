import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi, approvalsApi } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { isHrAdmin, isSuperAdmin } from '@/lib/roleUtils';
import { useLeaveTypes, LEAVE_TYPE_KEYS } from '@/hooks/useLeaveTypesQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatApprovalChain, normalizeApprovalSteps } from '@/lib/approvalSteps';
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
import { Plus, Trash2, Edit, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import LeaveTypeForm from '@/components/Leave/LeaveTypeForm';

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
  maxCarryOver: 0,
  approvalMode: 'default',
  approvalSteps: [],
};

export default function SettingsLeaveTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const { data: workflowData } = useQuery({
    queryKey: ['workflows'],
    queryFn: approvalsApi.getWorkflows,
  });
  const workflows = Array.isArray(workflowData) ? workflowData : workflowData?.data || [];
  const defaultLeaveWorkflow = workflows.find((workflow) => workflow.type === 'leave' && workflow.isActive !== false);
  const defaultChainLabel = defaultLeaveWorkflow?.levels?.length
    ? formatApprovalChain(defaultLeaveWorkflow.levels)
    : "a single approval from an HR Admin, Super Admin or the employee's manager";

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
      maxCarryOver: lt.maxCarryOver ?? DEFAULT_FORM_DATA.maxCarryOver,
      approvalMode: approvalSteps.length > 0 ? 'custom' : 'default',
      approvalSteps,
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

    const noticeDays = formData.hasNoticePeriod ? Math.max(0, parseInt(formData.noticePeriodDays, 10) || 0) : 0;
    const isHandoverRequired = Boolean(formData.requiresHandover || formData.handoverRequirement === 'COMPULSORY');

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
      maxCarryOver: parseFloat(formData.maxCarryOver) || 0,
      approvalSteps: useCustomSteps ? normalizeApprovalSteps(formData.approvalSteps) : [],
    };

    if (editingId) {
      updateLeaveType({ id: editingId, ...payload });
    } else {
      createLeaveType(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leave Types</h2>
        <p className="mt-1 text-slate-500">Configure available leave categories, quotas, notice periods, and rules.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
        <div className="space-y-4 lg:col-span-3">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-slate-500">Loading leave types...</CardContent></Card>
          ) : leaveTypes.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-500">No leave types configured yet.</CardContent></Card>
          ) : (
            leaveTypes.map(lt => {
              const hasNotice = Boolean(lt.hasNoticePeriod || (lt.noticePeriodDays > 0) || (lt.noticeDaysRequired > 0));
              const noticeDays = lt.noticePeriodDays || lt.noticeDaysRequired || 0;
              const isHandover = Boolean(lt.requiresHandover || lt.handoverRequirement === 'COMPULSORY');

              return (
                <motion.div key={lt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="flex items-start justify-between p-5">
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{lt.name}</h4>
                            {hasNotice && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <Calendar className="w-3 h-3" />
                                {noticeDays}d notice
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Default: {(lt.defaultDays ?? lt.daysPerYear ?? 0)} days/year • {lt.isPaid ? 'Paid' : 'Unpaid'} • {lt.requiresApproval === false ? 'Auto-approved' : 'Requires Approval'} • Handover: {isHandover ? 'Required' : 'Optional'}
                          </p>
                        </div>

                        {lt.requiresApproval !== false && (
                          <p className="text-xs text-slate-500">
                            <span className="font-medium text-slate-700">Approval flow: </span>
                            {lt.approvalSteps?.length
                              ? formatApprovalChain(lt.approvalSteps)
                              : `Organization default (${defaultChainLabel})`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 gap-1 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(lt)} className="text-slate-400 hover:text-indigo-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {canDeleteLeaveTypes && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(lt)}
                            disabled={isDeleting}
                            className="text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${lt.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="w-full lg:col-span-3">
          {isAdding ? (
            <LeaveTypeForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isPending={isPending}
              editingId={editingId}
              defaultChainLabel={defaultChainLabel}
            />
          ) : (
            <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Leave Type
            </Button>
          )}
        </div>
      </div>

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
