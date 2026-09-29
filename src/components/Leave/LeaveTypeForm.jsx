import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ApprovalStepsEditor from '@/components/approvals/ApprovalStepsEditor';

export default function LeaveTypeForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isPending,
  editingId,
  defaultChainLabel,
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{editingId ? 'Edit Leave Type' : 'Add Leave Type'}</CardTitle>
        <CardDescription>{editingId ? 'Update leave category' : 'Create a new leave category'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave-name">Name (e.g. Annual, Sick) *</Label>
            <Input 
              id="leave-name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Annual Leave"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-code">Leave Code</Label>
            <Input 
              id="leave-code"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              placeholder="annual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leave-days">Default Days Per Year</Label>
            <Input 
              id="leave-days"
              type="number"
              min="0"
              value={formData.daysPerYear}
              onChange={e => setFormData({ ...formData, daysPerYear: e.target.value })}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="is-paid" className="cursor-pointer">Is Paid Leave?</Label>
            <Switch 
              id="is-paid"
              checked={formData.isPaid}
              onCheckedChange={c => setFormData({ ...formData, isPaid: c })}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="requires-approval" className="cursor-pointer">Requires Approval?</Label>
            <Switch
              id="requires-approval"
              checked={formData.requiresApproval}
              onCheckedChange={c => setFormData({ ...formData, requiresApproval: c })}
            />
          </div>

          {/* Notice Period Configuration */}
          <div className="p-3 space-y-3 border rounded-md border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="has-notice-period" className="text-sm font-medium text-slate-800 cursor-pointer">
                  Notice Period Requirement
                </Label>
                <p className="text-xs text-slate-500">
                  Require employees to apply in advance before leave starts.
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
                  Notice Period (Days) *
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
                  className="bg-white"
                  required
                />
                <p className="text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  Employees will not be able to select dates within the next {formData.noticePeriodDays || 0} day(s) when applying.
                </p>
              </div>
            )}
          </div>

          {/* Handover Note Requirement Switch */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="requires-handover" className="text-sm font-medium text-slate-700 cursor-pointer">
                Require Handover Note?
              </Label>
              <p className="text-xs text-slate-500">
                When enabled, designating a relief officer and providing a handover note becomes required on requests.
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

          {formData.requiresApproval ? (
            <div className="p-3 space-y-3 border rounded-md border-slate-200">
              <Label className="text-sm font-medium text-slate-700">Approval Flow</Label>
              <RadioGroup
                value={formData.approvalMode}
                onValueChange={(approvalMode) => setFormData(prev => ({
                  ...prev,
                  approvalMode,
                  approvalSteps: approvalMode === 'custom' && prev.approvalSteps.length === 0
                    ? [{ order: 1, role: 'MANAGER' }]
                    : prev.approvalSteps,
                }))}
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
                  onChange={(approvalSteps) => setFormData(prev => ({ ...prev, approvalSteps }))}
                />
              )}
              <p className="text-xs text-slate-500">Changes apply to new requests; requests already submitted keep the flow they started with.</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Requests are approved as soon as they're submitted and deducted from the employee's balance. The employee's manager is notified.</p>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {editingId ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
