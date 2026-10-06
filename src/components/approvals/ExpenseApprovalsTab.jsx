import React, { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function ExpenseApprovalsTab({
  expenses = [],
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  canReview = true,
}) {
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleConfirmReject = () => {
    if (rejectTarget && onReject) {
      onReject({ id: rejectTarget._id || rejectTarget.id, reason: rejectionReason });
      setRejectTarget(null);
      setRejectionReason("");
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Expense Claims Pending</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          All employee reimbursement claims have been reviewed and actioned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Pending Expense Claims ({expenses.length})
          </h3>
          <p className="text-xs text-slate-500">
            Review and approve employee expense reimbursements and attached receipts.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {expenses.map((claim) => {
          const claimId = claim._id || claim.id;
          const employeeName =
            claim.employee?.fullName ||
            claim.employeeId?.fullName ||
            claim.employeeId?.employeeCode ||
            "Employee";

          return (
            <Card
              key={claimId}
              className="border border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Employee & Claim Meta */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {employeeName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="capitalize text-[11px] font-medium bg-slate-100 text-slate-700"
                        >
                          {claim.expenseType}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {claim.description || "No description provided."}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {claim.date ? format(new Date(claim.date), "MMM d, yyyy") : "—"}
                        </span>
                        {claim.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(claim.receiptUrl)}
                            className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" /> View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block uppercase tracking-wider">
                        Claim Amount
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₦{(claim.amount || 0).toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          {claim.currency || "NGN"}
                        </span>
                      </span>
                    </div>

                    {canReview && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRejecting}
                          onClick={() => {
                            setRejectTarget(claim);
                            setRejectionReason("");
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8 border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          disabled={isApproving}
                          onClick={() => onApprove(claimId)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {isApproving ? "Approving..." : "Approve"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!previewReceipt} onOpenChange={(open) => !open && setPreviewReceipt(null)}>
        <DialogContent className="max-w-xl p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Expense Receipt Attachment</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex justify-center bg-slate-50 rounded-lg p-2 max-h-[70vh] overflow-auto">
            {previewReceipt?.endsWith(".pdf") ? (
              <iframe src={previewReceipt} className="w-full h-96 rounded" title="Receipt PDF" />
            ) : (
              <img
                src={previewReceipt}
                alt="Receipt"
                className="max-h-[65vh] w-auto rounded object-contain"
              />
            )}
          </div>
          <DialogFooter className="mt-3">
            <Button size="sm" variant="outline" onClick={() => setPreviewReceipt(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Claim Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Reject Expense Claim
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-600">
              Provide a reason for rejecting this claim for{" "}
              <span className="font-semibold text-slate-800">
                ₦{(rejectTarget?.amount || 0).toLocaleString()}
              </span>
              . The employee will receive this feedback.
            </p>
            <div className="space-y-1">
              <Label htmlFor="rejection-reason" className="text-xs font-medium text-slate-700">
                Rejection Reason
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g. Missing valid receipt, expense exceeds allowance limit..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectTarget(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRejecting}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
