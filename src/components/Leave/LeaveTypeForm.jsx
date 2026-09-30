import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Briefcase, Layers } from 'lucide-react';
import ApprovalStepsEditor from '@/components/approvals/ApprovalStepsEditor';
import LeaveEligibilitySelector from './LeaveEligibilitySelector';
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
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {editingId ? 'Edit Leave Type' : 'Add New Leave Type'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {editingId
              ? 'Update leave configuration, quotas, rules, and eligible employee groups.'
              : 'Configure a new leave category, rules, approval flow, and eligible employee groups.'}
          </DialogDescription>
        </DialogHeader>

        <form id="leave-type-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic Info: Name, Code, Days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="leave-days" className="text-sm font-medium text-slate-700">
                Default Days Per Year
              </Label>
              <Input
                id="leave-days"
                type="number"
                min="0"
                value={formData.daysPerYear}
                onChange={(e) => setFormData({ ...formData, daysPerYear: e.target.value })}
                className="bg-white"
              />
            </div>
          </div>

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

          {/* Employee Eligibility: Confirmed Status, Types & Categories */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3.5 border rounded-lg border-slate-200/80 bg-slate-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="only-confirmed" className="text-sm font-medium text-slate-800 cursor-pointer">
                  Only Confirmed Employees
                </Label>
                <p className="text-xs text-slate-500">
                  When enabled, employees currently on probation cannot request this leave type.
                </p>
              </div>
              <Switch
                id="only-confirmed"
                checked={Boolean(formData.onlyConfirmed)}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, onlyConfirmed: checked }))
                }
              />
            </div>

            <LeaveEligibilitySelector
              label="Applicable Employment Types"
              helperText="Specify which employment types can request this leave (Permanent, Contract, etc.)"
              icon={Briefcase}
              options={employmentTypeOptions}
              selected={formData.employmentTypes || []}
              onChange={(types) => setFormData((prev) => ({ ...prev, employmentTypes: types }))}
              allLabel="All Employment Types"
              placeholder="Select employment type..."
            />

            <LeaveEligibilitySelector
              label="Applicable Employee Categories / Classes"
              helperText="Specify which employee classes/tiers can request this leave (Intern, Manager, etc.)"
              icon={Layers}
              options={employeeClassOptions}
              selected={formData.employeeClasses || []}
              onChange={(classes) => setFormData((prev) => ({ ...prev, employeeClasses: classes }))}
              allLabel="All Employee Categories"
              placeholder="Select employee category..."
            />
          </div>

          {/* Approval Flow */}
          {formData.requiresApproval ? (
            <div className="p-3.5 space-y-3 border rounded-lg border-slate-200 bg-slate-50/50">
              <Label className="text-sm font-medium text-slate-800">Approval Flow</Label>
              <RadioGroup
                value={formData.approvalMode}
                onValueChange={(approvalMode) =>
                  setFormData((prev) => ({
                    ...prev,
                    approvalMode,
                    approvalSteps:
                      approvalMode === 'custom' && prev.approvalSteps.length === 0
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
                />
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 border rounded-lg border-slate-200 bg-slate-50/50">
              Requests are approved as soon as they are submitted and deducted from the balance.
            </p>
          )}
        </form>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            form="leave-type-form"
            type="submit"
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 min-w-[110px]"
          >
            {isPending ? 'Saving...' : editingId ? 'Update Leave Type' : 'Save Leave Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
