import React, { useState } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LeaveActionDialog from './LeaveActionDialog';
import LeaveApprovalCard from './LeaveApprovalCard';

export default function PendingLeaveApprovals({
  requests = [],
  onApprove,
  onReject,
  isPending = false,
  safeDate,
}) {
  const [confirmState, setConfirmState] = useState(null); // { request, action }

  if (!requests || requests.length === 0) return null;

  const handleConfirm = (reason) => {
    if (!confirmState) return;
    if (confirmState.action === 'approve') {
      onApprove(confirmState.request);
    } else {
      onReject(confirmState.request, reason);
    }
  };

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-slate-50/30 to-white shadow-sm overflow-hidden">
      <CardHeader className="border-b border-indigo-100/70 pb-3 bg-white/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Pending Leave Approvals ({requests.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Review and approve leave requests submitted by colleagues in your organization.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-xs font-semibold px-2.5 py-1">
            Decision Required
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-3.5">
        {requests.map((request) => (
          <LeaveApprovalCard
            key={request.id || request._id}
            request={request}
            onApprove={(req) => setConfirmState({ request: req, action: 'approve' })}
            onReject={(req) => setConfirmState({ request: req, action: 'reject' })}
            isPending={isPending}
            safeDate={safeDate}
          />
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
