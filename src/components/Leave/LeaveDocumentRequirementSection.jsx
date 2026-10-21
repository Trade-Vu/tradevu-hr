import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function LeaveDocumentRequirementSection({ formData, setFormData }) {
  return (
    <div className="p-3.5 space-y-3 border rounded-lg border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="requires-attachment" className="text-sm font-medium text-slate-800 cursor-pointer">
            Require Supporting Document
          </Label>
          <p className="text-xs text-slate-500">
            Require employees to attach documents (e.g. medical certificates, doctor's reports, or admission letters).
          </p>
        </div>
        <Switch
          id="requires-attachment"
          checked={Boolean(formData.requiresAttachment)}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              requiresAttachment: checked,
              attachmentMinDays: checked ? (prev.attachmentMinDays ?? 0) : 0,
              attachmentRequiredForPastLeave: checked ? (prev.attachmentRequiredForPastLeave ?? true) : true,
            }))
          }
        />
      </div>

      {formData.requiresAttachment && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <div className="space-y-1.5">
            <Label htmlFor="attachment-min-days" className="text-sm font-medium text-slate-700">
              Exemption Threshold (Days)
            </Label>
            <Input
              id="attachment-min-days"
              type="number"
              min="0"
              value={formData.attachmentMinDays ?? 0}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  attachmentMinDays: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0),
                }));
              }}
              placeholder="0"
              className="bg-white max-w-xs"
            />
            <p className="text-xs text-slate-500">
              Set to <strong className="font-semibold text-slate-700">0</strong> to require for all requests. Set to <strong className="font-semibold text-slate-700">2</strong> for sick leave to only require doctor's reports when leave exceeds 2 days.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <Label htmlFor="attachment-past-leave" className="text-xs font-medium text-slate-700 cursor-pointer">
                Always require when logging past leave
              </Label>
              <p className="text-[11px] text-slate-500">
                Enforce supporting documents whenever employees log retrospective / past leave.
              </p>
            </div>
            <Switch
              id="attachment-past-leave"
              checked={formData.attachmentRequiredForPastLeave !== false}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  attachmentRequiredForPastLeave: checked,
                }))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
