import React, { useState } from 'react';
import { CheckCircle, Clock, Paperclip, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LeaveActionDialog from './LeaveActionDialog';

export default function PendingLeaveApprovals({ requests, onApprove, onReject, isPending, safeDate }) {
  const [confirmState, setConfirmState] = useState(null); // { request, action }

  if (requests.length === 0) return null;

  const handleConfirm = (reason) => {
    if (!confirmState) return;
    if (confirmState.action === 'approve') onApprove(confirmState.request);
    else onReject(confirmState.request, reason);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="border-b border-orange-200">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Pending Approvals ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-slate-900">{request.employee_name}</h4>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <strong>Type:</strong> {request.leave_type.replace('_', ' ')}
                      {request.isHalfDay && <Badge variant="secondary" className="text-[10px]">Half Day</Badge>}
                      {request.isAnnualPlan && (
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-indigo-200 text-indigo-700 bg-indigo-50">
                          Annual Plan
                        </Badge>
                      )}
                      {request.isPastLeave && (
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-amber-200 text-amber-700 bg-amber-50">
                          Past Leave
                        </Badge>
                      )}
                    </p>
                    <p><strong>Duration:</strong> {request.selectedDates?.length > 0
                      ? request.selectedDates.map((date) => format(safeDate(date), 'MMM d')).join(', ')
                      : `${format(safeDate(request.start_date), 'MMM d')} - ${format(safeDate(request.end_date), 'MMM d')}`} ({request.total_days} days)</p>
                    <p><strong>Reason:</strong> {request.reason}</p>
                    {request.relief_officer_name && (
                      <div className="flex items-center gap-2 flex-wrap py-0.5">
                        <span><strong>Relief Officer:</strong> {request.relief_officer_name}</span>
                        {request.relief_officer_status === 'CONFIRMED' && (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-semibold">
                            Handover Confirmed ✓
                          </Badge>
                        )}
                        {request.relief_officer_status === 'REJECTED' && (
                          <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200 text-[10px] font-semibold">
                            Handover Declined ✗
                          </Badge>
                        )}
                        {(!request.relief_officer_status || request.relief_officer_status === 'PENDING') && (
                          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] font-semibold">
                            Awaiting Relief Confirmation ⏳
                          </Badge>
                        )}
                      </div>
                    )}
                    {request.handover_note && (
                      <p><strong>Handover Note:</strong> {request.handover_note}</p>
                    )}
                    {request.handover_note_url && (
                      <p className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <a href={request.handover_note_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View Handover Document</a>
                      </p>
                    )}
                    {request.attachment_url && (
                      <p className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-500" />
                        <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmState({ request, action: 'approve' })} disabled={isPending}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmState({ request, action: 'reject' })} disabled={isPending}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <LeaveActionDialog
        open={!!confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
        action={confirmState?.action}
        employeeName={confirmState?.request?.employee_name}
        isPending={isPending}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}
