import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Plus, Trash2, User } from 'lucide-react';
import { employeesApi } from '@/api';
import {
  APPROVER_ROLE_OPTIONS,
  APPROVAL_STEP_SEQUENCE,
  normalizeApprovalRole,
  getApprovalRoleLabel,
} from '@/lib/approvalSteps';

/**
 * Ordered list of approval steps ({ order, role, userId, employeeId, approverName }),
 * shared by Settings → Approval Workflows and the per-leave-type approval flow.
 * If 'OTHER' is selected for a step, an additional dropdown allows designating a specific user.
 */
export default function ApprovalStepsEditor({
  steps = [],
  onChange,
  emptyMessage,
  disabled = false,
  employees: propEmployees,
}) {
  // If employees prop is not provided, fetch all active employees as fallback
  const { data: rawFetchedEmployees = [] } = useQuery({
    queryKey: ['employees', 'list', 'approverOptions'],
    queryFn: async () => {
      const res = await employeesApi.getAllEmployees();
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
    enabled: !propEmployees || propEmployees.length === 0,
  });

  const availableEmployees = useMemo(() => {
    const list = propEmployees && propEmployees.length > 0 ? propEmployees : rawFetchedEmployees;
    return (Array.isArray(list) ? list : []).map((emp) => ({
      id: String(emp.id || emp._id),
      userId: emp.userId ? String(emp.userId) : String(emp.id || emp._id),
      fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Unnamed Employee',
      email: emp.email || '',
      jobTitle: emp.jobTitle || emp.job_title || emp.role || '',
    }));
  }, [propEmployees, rawFetchedEmployees]);

  const emit = (next) => onChange(next.map((step, index) => ({ ...step, order: index + 1 })));

  const updateRole = (index, role) => {
    const normalized = normalizeApprovalRole(role);
    emit(
      steps.map((step, i) => {
        if (i !== index) return step;
        if (normalized !== 'OTHER') {
          // If changing away from OTHER, remove specific user references
          const { userId, employeeId, approverName, ...rest } = step;
          return { ...rest, role };
        }
        return { ...step, role };
      })
    );
  };

  const updateCustomApprover = (index, selectedId) => {
    const selected = availableEmployees.find(
      (e) => String(e.id) === String(selectedId) || String(e.userId) === String(selectedId)
    );
    emit(
      steps.map((step, i) =>
        i === index
          ? {
              ...step,
              userId: selected?.userId || selected?.id,
              employeeId: selected?.id,
              approverName: selected?.fullName || 'Custom Approver',
            }
          : step
      )
    );
  };

  const remove = (index) => emit(steps.filter((_, i) => i !== index));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  const nextRole =
    APPROVAL_STEP_SEQUENCE.find((role) => !steps.some((s) => normalizeApprovalRole(s.role) === role)) ||
    APPROVAL_STEP_SEQUENCE[steps.length] ||
    'OTHER';

  const canAddMore = steps.length < APPROVAL_STEP_SEQUENCE.length + 5; // Allow multiple custom steps if needed

  const add = () => {
    if (!canAddMore) return;
    emit([...steps, { role: nextRole }]);
  };

  return (
    <div className="space-y-2.5">
      {steps.length === 0 && emptyMessage && <p className="text-sm text-slate-500">{emptyMessage}</p>}

      {steps.map((step, index) => {
        const isOther = normalizeApprovalRole(step.role) === 'OTHER';
        const currentApproverId = step.employeeId || step.userId || '';

        return (
          <div
            key={index}
            className="p-2.5 border rounded-lg bg-slate-50 border-slate-200/80 transition-all space-y-2"
          >
            {/* Main Step Row */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-xs font-semibold shrink-0 text-slate-600">
                Step {index + 1}
              </span>

              <div className="flex-1">
                <Select
                  value={normalizeApprovalRole(step.role)}
                  onValueChange={(role) => updateRole(index, role)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-xs bg-white" aria-label={`Step ${index + 1} approver`}>
                    <SelectValue placeholder="Select approver role" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVER_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move step ${index + 1} up`}
                >
                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === steps.length - 1}
                  aria-label={`Move step ${index + 1} down`}
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 w-7 h-7 hover:text-red-600 hover:bg-red-50"
                  onClick={() => remove(index)}
                  disabled={disabled || steps.length <= 1}
                  aria-label={`Remove step ${index + 1}`}
                  title={steps.length <= 1 ? 'At least one approval step is required' : `Remove step ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Sub-dropdown when role is OTHER */}
            {isOther && (
              <div className="pl-14 pr-2 pt-1 border-t border-slate-200/50">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Designate user:
                  </span>
                  <div className="flex-1">
                    <Select
                      value={currentApproverId}
                      onValueChange={(val) => updateCustomApprover(index, val)}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={`h-8 text-xs bg-white ${
                          !currentApproverId ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                        }`}
                        aria-label={`Designated custom approver for step ${index + 1}`}
                      >
                        <SelectValue placeholder="Select a specific employee..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {availableEmployees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{emp.fullName}</span>
                              {emp.jobTitle && (
                                <span className="text-[11px] text-slate-400">· {emp.jobTitle}</span>
                              )}
                              {emp.email && (
                                <span className="text-[10px] text-slate-400 font-mono">({emp.email})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!currentApproverId && (
                  <p className="text-[11px] text-amber-600 mt-1 pl-4">
                    ⚠️ Please designate a specific employee to approve this step.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {canAddMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={disabled}
          className="w-full text-xs border-dashed text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Step {steps.length + 1} ({getApprovalRoleLabel(nextRole)})
        </Button>
      ) : (
        <p className="text-center text-[11px] text-slate-400 py-1 font-medium">
          All approval steps configured ({steps.length})
        </p>
      )}
    </div>
  );
}
