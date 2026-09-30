import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, UserCheck, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReliefHandoverConfirmations({
  requests = [],
  onConfirm,
  isPending = false,
  safeDate,
}) {
  const [rejectDialog, setRejectDialog] = useState(null); // request object
  const [rejectReason, setRejectReason] = useState('');

  const pendingRequests = requests.filter(
    (r) => !r.reliefOfficerStatus || r.reliefOfficerStatus === 'PENDING'
  );

  if (pendingRequests.length === 0) return null;

  const handleDeclineSubmit = () => {
    if (!rejectDialog) return;
    onConfirm({
      id: rejectDialog._id || rejectDialog.id,
      action: 'REJECTED',
      comments: rejectReason.trim() || 'Declined by relief officer',
    });
    setRejectDialog(null);
    setRejectReason('');
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white shadow-sm">
      <CardHeader className="border-b border-indigo-100/80 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Relief Officer Handover Confirmations ({pendingRequests.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Colleagues in your department have nominated you as their relief officer. Please review and confirm their handover notes.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50 text-xs font-semibold px-2.5 py-1">
            Action Required
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {pendingRequests.map((request) => {
          const employeeName = request.employeeId?.fullName || request.employeeId?.name || request.employee_name || 'Colleague';
          const departmentName = request.employeeId?.departmentId?.name || request.employeeId?.department?.name || 'Same Department';
          const leaveTypeName = request.leaveTypeId?.name || request.leave_type || 'Leave';

          return (
            <div
              key={request._id || request.id}
              className="p-4 bg-white rounded-xl border border-indigo-100/80 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>{employeeName}</span>
                    <Badge variant="secondary" className="text-[11px] font-normal bg-slate-100 text-slate-600">
                      {departmentName}
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-700">{leaveTypeName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {request.startDate && request.endDate
                        ? `${format(safeDate(request.startDate), 'MMM d, yyyy')} - ${format(safeDate(request.endDate), 'MMM d, yyyy')}`
                        : 'Scheduled period'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                      {request.totalDays || 0} {request.totalDays === 1 ? 'day' : 'days'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 sm:pt-0">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 shadow-xs"
                    onClick={() =>
                      onConfirm({
                        id: request._id || request.id,
                        action: 'CONFIRMED',
                      })
                    }
                    disabled={isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Confirm Handover
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 font-medium text-xs h-8"
                    onClick={() => setRejectDialog(request)}
                    disabled={isPending}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                  </Button>
                </div>
              </div>

              {/* Handover Note details */}
              <div className="space-y-2 text-xs">
                {request.handoverNote ? (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-1">Handover Instructions / Summary:</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{request.handoverNote}</p>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No text summary provided.</div>
                )}

                {request.handoverNoteUrl && (
                  <div className="pt-1">
                    <a
                      href={request.handoverNoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Completed Handover Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      {/* Decline Comments Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" /> Decline Relief Officer Request
            </DialogTitle>
            <DialogDescription>
              Please let {rejectDialog?.employeeId?.fullName || 'the employee'} know why you cannot confirm this handover note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Missing login delegation steps, conflicting leave schedule, tasks not yet covered..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDeclineSubmit}
              disabled={isPending}
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
