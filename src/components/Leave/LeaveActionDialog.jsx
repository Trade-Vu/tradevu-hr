import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Shared confirm step for leave approve/reject actions, used by PendingApprovals,
// LeaveOverview and AllLeaveRequests so the "are you sure" UX (and the reject-reason
// requirement) is consistent everywhere instead of each page rolling its own.
export default function LeaveActionDialog({ open, onOpenChange, action, employeeName, isPending, onConfirm }) {
  const [reason, setReason] = useState('');
  const isReject = action === 'reject';

  const close = () => {
    setReason('');
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm(isReject ? reason.trim() : undefined);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReject ? <XCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {isReject ? 'Reject Leave Request' : 'Approve Leave Request'}
          </DialogTitle>
          <DialogDescription>
            {isReject
              ? `Reject ${employeeName ? `${employeeName}'s` : 'this'} leave request? They'll be notified with the reason below.`
              : `Approve ${employeeName ? `${employeeName}'s` : 'this'} leave request?`}
          </DialogDescription>
        </DialogHeader>
        {isReject && (
          <div className="py-2 space-y-2">
            <Label>Reason for rejection (required)</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Let them know why this is being rejected..."
              rows={3}
              autoFocus
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className={isReject ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            onClick={handleConfirm}
            disabled={isPending || (isReject && !reason.trim())}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isReject ? 'Reject Request' : 'Approve Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
