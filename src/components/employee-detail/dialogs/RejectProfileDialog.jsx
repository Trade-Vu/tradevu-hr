import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RejectProfileDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Profile Revision</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Provide feedback for the employee on what details need to be corrected or updated. Their profile status will return to Draft.
          </p>
          <div className="space-y-2">
            <Label>Reason for Revision</Label>
            <Textarea
              placeholder="e.g. Please provide a clear national ID number and valid private email..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="text-white bg-red-600 hover:bg-red-700"
            disabled={isPending || !reason.trim()}
            onClick={() => {
              onConfirm(reason);
              setReason('');
            }}
          >
            {isPending ? "Submitting..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
