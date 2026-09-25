import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveApi, approvalsApi } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { isHrAdmin, isSuperAdmin } from '@/lib/roleUtils';
import { useLeaveTypes, LEAVE_TYPE_KEYS } from '@/hooks/useLeaveTypesQuery';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import ApprovalStepsEditor from '@/components/approvals/ApprovalStepsEditor';
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
} from '../components/ui/alert-dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_FORM_DATA = {
  name: '',
  code: '',
  daysPerYear: 10,
  isPaid: true,
  requiresApproval: true,
  // Not editable on this form yet, but part of the leave type: carried through on edit so saving
  // doesn't reset them (the payload used to hard-code these values on every update).
  requiresAttachment: false,
  allowHalfDay: true,
  maxCarryOver: 0,
  // 'default' = the organization's leave workflow; 'custom' = approvalSteps below, stored on the leave type.
  approvalMode: 'default',
  approvalSteps: [],
  // "Eligible After (Days of Service)" and "Overrides by Employee Class" were removed from this form:
  // the backend has no fields for them, so anything entered was silently discarded on save.
};

export default function SettingsLeaveTypes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Same key and fetcher as Settings → Approval Workflows, so both pages share one cache entry.
  const { data: workflowData } = useQuery({
    queryKey: ['workflows'],
    queryFn: approvalsApi.getWorkflows,
  });
  const workflows = Array.isArray(workflowData) ? workflowData : workflowData?.data || [];
  // The backend uses the first active 'leave' workflow as the org default.
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
    setFormData({
      name: lt.name,
      code: lt.code || '',
      daysPerYear: lt.defaultDays ?? lt.daysPerYear ?? 10,
      isPaid: lt.isPaid,
      requiresApproval: lt.requiresApproval,
      requiresAttachment: lt.requiresAttachment ?? DEFAULT_FORM_DATA.requiresAttachment,
      allowHalfDay: lt.allowHalfDay ?? DEFAULT_FORM_DATA.allowHalfDay,
      maxCarryOver: lt.maxCarryOver ?? DEFAULT_FORM_DATA.maxCarryOver,
      approvalMode: approvalSteps.length > 0 ? 'custom' : 'default',
      approvalSteps,
    });
    // useLeaveTypes maps _id -> id; before it did, this was undefined and "Update" created a duplicate.
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

    const payload = {
      name: formData.name,
      code: formData.code || undefined,
      defaultDays: parseFloat(formData.daysPerYear) || 0,
      isPaid: formData.isPaid,
      requiresApproval: formData.requiresApproval,
      requiresAttachment: formData.requiresAttachment,
      allowHalfDay: formData.allowHalfDay,
      maxCarryOver: parseFloat(formData.maxCarryOver) || 0,
      // Empty = organization default. Also cleared when approval is off, so turning it back on later
      // doesn't silently resurrect an old chain.
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
        <p className="mt-1 text-slate-500">Configure available leave categories, quotas, and rules.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
        <div className="space-y-4 lg:col-span-3">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-slate-500">Loading leave types...</CardContent></Card>
          ) : leaveTypes.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-slate-500">No leave types configured yet.</CardContent></Card>
          ) : (
            leaveTypes.map(lt => (
              <motion.div key={lt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent className="flex items-start justify-between p-5">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{lt.name}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Default: {(lt.defaultDays ?? lt.daysPerYear ?? 0)} days/year • {lt.isPaid ? 'Paid' : 'Unpaid'} • {lt.requiresApproval === false ? 'Auto-approved' : 'Requires Approval'}
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
            ))
          )}
        </div>

        <div className="w-full lg:col-span-3">
          {isAdding ? (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</CardTitle>
                <CardDescription>{editingId ? 'Update leave category' : 'Create a new leave category'}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Name (e.g. Annual, Sick)</label>
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Annual Leave"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Leave Code</label>
                    <Input 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      placeholder="annual"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Default Days Per Year</label>
                    <Input 
                      type="number"
                      value={formData.daysPerYear}
                      onChange={e => setFormData({...formData, daysPerYear: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm font-medium text-slate-700">Is Paid Leave?</label>
                    <Switch 
                      checked={formData.isPaid}
                      onCheckedChange={c => setFormData({...formData, isPaid: c})}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="requires-approval">Requires Approval?</label>
                    <Switch
                      id="requires-approval"
                      checked={formData.requiresApproval}
                      onCheckedChange={c => setFormData({...formData, requiresApproval: c})}
                    />
                  </div>

                  {formData.requiresApproval ? (
                    <div className="p-3 space-y-3 border rounded-md border-slate-200">
                      <p className="text-sm font-medium text-slate-700">Approval flow</p>
                      <RadioGroup
                        value={formData.approvalMode}
                        onValueChange={(approvalMode) => setFormData(prev => ({
                          ...prev,
                          approvalMode,
                          // Seed a sensible first step when switching to custom with nothing configured.
                          approvalSteps: approvalMode === 'custom' && prev.approvalSteps.length === 0
                            ? [{ order: 1, role: 'MANAGER' }]
                            : prev.approvalSteps,
                        }))}
                        className="space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <RadioGroupItem value="default" id="approval-default" className="mt-0.5" />
                          <label htmlFor="approval-default" className="text-sm cursor-pointer text-slate-700">
                            Organization default
                            <span className="block text-xs text-slate-500">{defaultChainLabel}</span>
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <RadioGroupItem value="custom" id="approval-custom" className="mt-0.5" />
                          <label htmlFor="approval-custom" className="text-sm cursor-pointer text-slate-700">
                            Custom steps for this leave type
                          </label>
                        </div>
                      </RadioGroup>

                      {formData.approvalMode === 'custom' && (
                        <ApprovalStepsEditor
                          steps={formData.approvalSteps}
                          onChange={(approvalSteps) => setFormData(prev => ({ ...prev, approvalSteps }))}
                        />
                      )}
                      <p className="text-xs text-slate-500">Changes apply to new requests; requests already submitted keep the flow they started with.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Requests are approved as soon as they're submitted and deducted from the employee's balance. The employee's manager is notified.</p>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={isPending}>{editingId ? 'Update' : 'Save'}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
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
