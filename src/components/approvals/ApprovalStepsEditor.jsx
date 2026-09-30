import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  APPROVER_ROLE_OPTIONS,
  APPROVAL_STEP_SEQUENCE,
  normalizeApprovalRole,
  getApprovalRoleLabel,
} from '@/lib/approvalSteps';

/**
 * Ordered list of approval steps ({ order, role }), shared by Settings → Approval Workflows and
 * the per-leave-type approval flow. `order` is always rewritten to the step's position.
 */
export default function ApprovalStepsEditor({ steps = [], onChange, emptyMessage, disabled = false }) {
  const emit = (next) => onChange(next.map((step, index) => ({ ...step, order: index + 1 })));

  const updateRole = (index, role) => emit(steps.map((step, i) => (i === index ? { ...step, role } : step)));
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

  const canAddMore = steps.length < APPROVAL_STEP_SEQUENCE.length;

  const add = () => {
    if (!canAddMore) return;
    emit([...steps, { role: nextRole }]);
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && emptyMessage && <p className="text-sm text-slate-500">{emptyMessage}</p>}

      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-slate-50 border-slate-100">
          <span className="w-12 text-xs font-semibold shrink-0 text-slate-600">Step {index + 1}</span>
          <Select value={normalizeApprovalRole(step.role)} onValueChange={(role) => updateRole(index, role)} disabled={disabled}>
            <SelectTrigger className="h-8 text-sm" aria-label={`Step ${index + 1} approver`}>
              <SelectValue placeholder="Approver" />
            </SelectTrigger>
            <SelectContent>
              {APPROVER_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex shrink-0">
            <Button type="button" variant="ghost" size="icon" className="w-7 h-7" onClick={() => move(index, -1)} disabled={disabled || index === 0} aria-label={`Move step ${index + 1} up`}>
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="w-7 h-7" onClick={() => move(index, 1)} disabled={disabled || index === steps.length - 1} aria-label={`Move step ${index + 1} down`}>
              <ArrowDown className="w-3.5 h-3.5" />
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
      ))}

      {canAddMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={disabled}
          className="w-full text-xs border-dashed text-slate-700 hover:text-blue-600 hover:border-blue-300"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Step {steps.length + 1} ({getApprovalRoleLabel(nextRole)})
        </Button>
      ) : (
        <p className="text-center text-[11px] text-slate-400 py-1 font-medium">
          All approval steps configured ({steps.length}/{APPROVAL_STEP_SEQUENCE.length})
        </p>
      )}
    </div>
  );
}
