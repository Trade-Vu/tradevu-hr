import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OffboardEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  isPending,
}) {
  const [form, setForm] = useState({
    type: 'RESIGNATION',
    exitDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offboard Employee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Exit Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIGNATION">Resigned</SelectItem>
                <SelectItem value="TERMINATION">Terminated / Fired</SelectItem>
                <SelectItem value="RETIREMENT">Retirement</SelectItem>
                <SelectItem value="CONTRACT_EXPIRATION">Contract Expiration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Exit Date</Label>
            <Input
              type="date"
              value={form.exitDate}
              onChange={e => setForm({ ...form, exitDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason for leaving..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="text-white bg-red-600 hover:bg-red-700"
            onClick={() => {
              onConfirm({
                id: employee?.id,
                data: {
                  exitType: form.type,
                  exitDate: form.exitDate,
                  reason: form.reason,
                },
              });
            }}
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
