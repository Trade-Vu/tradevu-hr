import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ApprovalStepsEditor from '@/components/approvals/ApprovalStepsEditor';
import LeaveQuotaExceptionsEditor from './LeaveQuotaExceptionsEditor';
import LeaveTargetingSection from './LeaveTargetingSection';
import { DEFAULT_LEAVE_APPROVAL_STEPS } from '@/lib/approvalSteps';

export default function LeaveTypeForm({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isPending,
  editingId,
  defaultChainLabel,
  employmentTypeOptions = [],
  employeeClassOptions = [],
  employees = [],
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-white shadow-2xl overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50 shrink-0 text-left">
          <SheetTitle className="text-xl font-bold text-slate-900">
            {editingId ? 'Edit Leave Type' : 'Add New Leave Type'}
          </SheetTitle>
          <SheetDescription className="text-slate-500 text-xs">
            {editingId
              ? 'Update leave configuration, quotas, rules, and approval flow.'
              : 'Configure a new leave category, rules, approval flow, and tiered quota exceptions.'}
          </SheetDescription>
        </SheetHeader>

        <form id="leave-type-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic Info: Name, Code, Days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="leave-name" className="text-sm font-medium text-slate-700">
                Name (e.g. Annual, Sick) *
              </Label>
              <Input
                id="leave-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Annual Leave"
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-code" className="text-sm font-medium text-slate-700">
                Leave Code
              </Label>
              <Input
                id="leave-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. annual"
                className="bg-white"
              />
            </div>
          </div>

          {/* Quota & Exceptions Section */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200/80 bg-white">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="leave-days" className="text-sm font-semibold text-slate-800">
                Default Days Per Year *
              </Label>
              <Input
                id="leave-days"
                type="number"
                min="0"
                value={formData.daysPerYear}
                onChange={(e) => setFormData({ ...formData, daysPerYear: e.target.value })}
                className="bg-white"
                required
              />
              <p className="text-xs text-slate-400">
                Baseline annual days given to employees without a specific exception.
              </p>
            </div>

            {/* Exceptions Builder: Class, Type, or Individual */}
            <LeaveQuotaExceptionsEditor
              exceptions={formData.daysExceptions || []}
              onChange={(daysExceptions) => setFormData((prev) => ({ ...prev, daysExceptions }))}
              employeeClassOptions={employeeClassOptions}
              employmentTypeOptions={employmentTypeOptions}
              employees={employees}
              defaultDays={formData.daysPerYear}
            />
          </div>

          {/* Target Gender Section */}
          <LeaveTargetingSection
            formData={formData}
            setFormData={setFormData}
          />

          {/* Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 border rounded-lg border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <Label htmlFor="is-paid" className="text-sm font-medium text-slate-700 cursor-pointer">
                Paid Leave
              </Label>
              <Switch
                id="is-paid"
                checked={formData.isPaid}
                onCheckedChange={(c) => setFormData({ ...formData, isPaid: c })}
              />
            </div>

            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <Label htmlFor="allow-half-day" className="text-sm font-medium text-slate-700 cursor-pointer">
                Allow Half-Day
              </Label>
              <Switch
                id="allow-half-day"
                checked={formData.allowHalfDay}
                onCheckedChange={(c) => setFormData({ ...formData, allowHalfDay: c })}
              />
            </div>

            <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
              <Label htmlFor="requires-approval" className="text-sm font-medium text-slate-700 cursor-pointer">
                Requires Approval
              </Label>
              <Switch
                id="requires-approval"
                checked={formData.requiresApproval}
                onCheckedChange={(c) => setFormData({ ...formData, requiresApproval: c })}
              />
            </div>
          </div>

          {/* Notice Period Configuration */}
          <div className="p-3.5 space-y-3 border rounded-lg border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-notice-period" className="text-sm font-medium text-slate-800 cursor-pointer">
                  Advance Notice Requirement
                </Label>
                <p className="text-xs text-slate-500">
                  Require employees to apply in advance before leave begins.
                </p>
              </div>
              <Switch
                id="has-notice-period"
                checked={formData.hasNoticePeriod}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasNoticePeriod: checked,
                    noticePeriodDays: checked ? (prev.noticePeriodDays > 0 ? prev.noticePeriodDays : 7) : 0,
                  }))
                }
              />
            </div>

            {formData.hasNoticePeriod && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <Label htmlFor="notice-period-days" className="text-sm font-medium text-slate-700">
                  Required Notice (Days) *
                </Label>
                <Input
                  id="notice-period-days"
                  type="number"
                  min="1"
                  value={formData.noticePeriodDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      noticePeriodDays: val === '' ? '' : Math.max(1, parseInt(val, 10) || 1),
                    }));
                  }}
                  placeholder="e.g. 7"
                  className="bg-white max-w-xs"
                  required
                />
                <p className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                  Employees will not be able to select dates within the next {formData.noticePeriodDays || 0} day(s).
                </p>
              </div>
            )}
          </div>

          {/* Handover Note Requirement Switch */}
          <div className="flex items-center justify-between p-3.5 border rounded-lg border-slate-200/80 bg-slate-50/50">
            <div className="space-y-0.5">
              <Label htmlFor="requires-handover" className="text-sm font-medium text-slate-800 cursor-pointer">
                Require Handover Note
              </Label>
              <p className="text-xs text-slate-500">
                When enabled, employees must provide a handover note or document. When disabled, handover notes are optional. (A relief officer is always required for all leave requests).
              </p>
            </div>
            <Switch
              id="requires-handover"
              checked={Boolean(formData.requiresHandover || formData.handoverRequirement === 'COMPULSORY')}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  requiresHandover: checked,
                  handoverRequirement: checked ? 'COMPULSORY' : 'OPTIONAL',
                }))
              }
            />
          </div>

          {/* Approval Flow */}
          {formData.requiresApproval ? (
            <div className="p-3.5 space-y-3 border rounded-lg border-slate-200 bg-slate-50/50">
              <Label className="text-sm font-medium text-slate-800">Approval Flow</Label>
              <RadioGroup
                value={formData.approvalMode || 'default'}
                onValueChange={(approvalMode) =>
                  setFormData((prev) => ({
                    ...prev,
                    approvalMode,
                    approvalSteps:
                      approvalMode === 'custom' && (!prev.approvalSteps || prev.approvalSteps.length === 0)
                        ? DEFAULT_LEAVE_APPROVAL_STEPS
                        : prev.approvalSteps,
                  }))
                }
                className="space-y-2"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="default" id="approval-default" className="mt-0.5" />
                  <Label htmlFor="approval-default" className="text-sm font-normal cursor-pointer text-slate-700">
                    Organization default
                    <span className="block text-xs text-slate-500">{defaultChainLabel}</span>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="custom" id="approval-custom" className="mt-0.5" />
                  <Label htmlFor="approval-custom" className="text-sm font-normal cursor-pointer text-slate-700">
                    Custom steps for this leave type
                  </Label>
                </div>
              </RadioGroup>

              {formData.approvalMode === 'custom' && (
                <ApprovalStepsEditor
                  steps={formData.approvalSteps}
                  onChange={(approvalSteps) => setFormData((prev) => ({ ...prev, approvalSteps }))}
                  employees={employees}
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 border rounded-lg border-slate-200 bg-slate-50/50">
              Requests are approved as soon as they are submitted and deducted from the balance.
            </p>
          )}
        </form>

        <SheetFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            form="leave-type-form"
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : editingId ? 'Update Leave Type' : 'Save Leave Type'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
