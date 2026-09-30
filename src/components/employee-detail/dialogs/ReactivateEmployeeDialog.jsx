import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck } from "lucide-react";

export default function ReactivateEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isPending,
}) {
  const [form, setForm] = useState({
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const isSuspended = (employee?.employment_status || employee?.employmentStatus || '').toUpperCase() === 'SUSPENDED';

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setForm({
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm({
      id: employee?.id,
      data: {
        effectiveDate: form.effectiveDate,
        reason: form.reason?.trim() || (isSuspended ? 'Suspension lifted, reinstated to active status' : 'Reactivated to active status'),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                {isSuspended ? 'Reinstate Employee' : 'Make Employee Active'}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            {isSuspended
              ? `Reinstating ${employee?.full_name || 'this employee'} will lift their suspension and return their status to Active.`
              : `Making ${employee?.full_name || 'this employee'} active will restore their employment status and reactivate their system profile.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="effective-date" className="text-xs font-medium text-slate-700">
              Effective Date
            </Label>
            <Input
              id="effective-date"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reactivate-reason" className="text-xs font-medium text-slate-700">
              Reason / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="reactivate-reason"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder={isSuspended ? "e.g. Investigation completed, reinstated..." : "e.g. Rehired, separation reversed..."}
              className="resize-none h-20 text-sm"
            />
          </div>

          <DialogFooter className="mt-2 sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              disabled={isPending}
            >
              {isPending ? 'Updating...' : (isSuspended ? 'Reinstate to Active' : 'Make Active')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
