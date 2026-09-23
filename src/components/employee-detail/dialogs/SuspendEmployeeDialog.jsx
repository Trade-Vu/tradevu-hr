import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function SuspendEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isPending,
}) {
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    superAdminApproved: false,
  });

  const handleSubmit = () => {
    if (!form.superAdminApproved) return toast.error('Super Admin approval is required.');
    if (!form.startDate || !form.endDate || !form.reason) return toast.error('Please fill all fields.');
    onConfirm({
      id: employee?.id,
      data: {
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        superAdminApproved: form.superAdminApproved,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend Employee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason for suspension..."
            />
          </div>
          <div className="flex items-center py-2 space-x-2">
            <Checkbox
              id="sa-approve"
              checked={form.superAdminApproved}
              onCheckedChange={c => setForm({ ...form, superAdminApproved: !!c })}
            />
            <Label htmlFor="sa-approve">Super Admin Approved</Label>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.superAdminApproved}
            className="w-full text-white bg-amber-600 hover:bg-amber-700"
          >
            {isPending ? 'Suspending...' : 'Confirm Suspension'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
