import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ApprovalsOffboardDialog({
  open,
  onOpenChange,
  offboardForm,
  setOffboardForm,
  onSubmit,
  isSubmitting,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Offboard Employee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Exit Type</Label>
            <Select value={offboardForm.type} onValueChange={(v) => setOffboardForm({ ...offboardForm, type: v })}>
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
            <Input type="date" value={offboardForm.exitDate} onChange={(e) => setOffboardForm({ ...offboardForm, exitDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea value={offboardForm.reason} onChange={(e) => setOffboardForm({ ...offboardForm, reason: e.target.value })} placeholder="Reason for leaving..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
