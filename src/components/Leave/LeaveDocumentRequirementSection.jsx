import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export default function LeaveDocumentRequirementSection({ formData, setFormData }) {
  const minDays = Number(formData.attachmentMinDays) || 0;

  return (
    <div className="p-3.5 space-y-3.5 border rounded-lg border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 pr-2">
          <Label htmlFor="requires-attachment" className="text-sm font-medium text-slate-800 cursor-pointer">
            Require Supporting Document
          </Label>
          <p className="text-xs text-slate-500">
            Require employees to attach verification (e.g. medical certificates, doctor's reports, or admission letters).
          </p>
        </div>
        <Switch
          id="requires-attachment"
          checked={Boolean(formData.requiresAttachment)}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              requiresAttachment: checked,
              attachmentMinDays: checked ? (prev.attachmentMinDays ?? '') : '',
            }))
          }
        />
      </div>

      {formData.requiresAttachment && (
        <div className="space-y-3.5 pt-3 border-t border-slate-200">
          <div className="space-y-1.5">
            <Label htmlFor="attachment-min-days" className="text-sm font-medium text-slate-700">
              Exempt Duration Threshold (Days)
            </Label>
            <Input
              id="attachment-min-days"
              type="number"
              min="0"
              value={formData.attachmentMinDays ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  attachmentMinDays: val === '' ? '' : Math.max(0, parseInt(val, 10) || 0),
                }));
              }}
              placeholder="0"
              className="bg-white max-w-xs"
            />
            <p className="text-xs text-slate-500">
              Maximum days an employee can request without attaching a document. Set to <strong className="font-semibold text-slate-700">0</strong> (or leave blank) to require documentation for all requests.
            </p>

            {/* Live Policy Preview */}
            <div className="flex items-start gap-2 p-2.5 mt-2 rounded-md border text-xs bg-white text-slate-700 border-slate-200 shadow-xs">
              {minDays === 0 ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Always Required:</span> Every request of this leave type (even 0.5 or 1 day) requires a supporting document.
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Exempt up to {minDays} day{minDays > 1 ? 's' : ''}:</span> Requests of {minDays} day{minDays > 1 ? 's' : ''} or less are exempt. Requests exceeding {minDays} day{minDays > 1 ? 's' : ''} strictly require documentation.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
