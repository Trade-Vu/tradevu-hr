import React from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  UserCheck,
  FileText,
  Paperclip,
  MessageSquare,
  ShieldCheck,
  Edit,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLeaveStatus, getLeaveStatusBadgeClass, isPendingLeaveStatus } from '@/lib/leaveStatus';

export default function LeaveApprovalCard({
  request,
  onApprove,
  onReject,
  onEdit,
  isPending = false,
  managerApproved = false,
  safeDate = (d) => (d ? new Date(d) : new Date()),
  showStatusBadge = false,
}) {
  const isPendingStatus = isPendingLeaveStatus(request.status);
  const employeeName =
    request.employee_name ||
    request.employeeId?.fullName ||
    request.employeeId?.name ||
    'Employee';
  const departmentName =
    request.department_name ||
    request.employeeId?.departmentId?.name ||
    request.employeeId?.department?.name ||
    '';
  const leaveTypeName =
    request.leave_type ||
    request.leaveTypeId?.name ||
    'Annual Leave';

  const hasReliefOfficer = Boolean(
    request.relief_officer_name ||
    request.reliefOfficerId?.fullName ||
    request.reliefOfficerId?.name ||
    (typeof request.reliefOfficerId === 'string' && request.reliefOfficerId.length > 5)
  );

  const reliefOfficerName =
    request.relief_officer_name ||
    request.reliefOfficerId?.fullName ||
    request.reliefOfficerId?.name ||
    'Assigned Colleague';

  const reliefStatus = (
    request.relief_officer_status ||
    request.reliefOfficerStatus ||
    'PENDING'
  ).toUpperCase();

  const handoverNote = request.handover_note || request.handoverNote || '';
  const handoverNoteUrl = request.handover_note_url || request.handoverNoteUrl || '';
  const attachmentUrl = request.attachment_url || request.attachmentUrl || '';

  const initials = employeeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'E';

  return (
    <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200/90 hover:shadow-sm transition-all duration-150 space-y-3.5 group">
      {/* Header Row: Employee Info & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {/* Avatar / Initials */}
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100/90 text-indigo-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-none">
                {employeeName}
              </h4>
              {departmentName && (
                <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600 px-2 py-0 h-5">
                  {departmentName}
                </Badge>
              )}
              {showStatusBadge && !isPendingStatus && (
                <Badge className={`${getLeaveStatusBadgeClass(request.status)} border text-[10px] font-semibold px-2 py-0 h-5`}>
                  {formatLeaveStatus(request.status)}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{leaveTypeName.replace(/_/g, ' ')}</span>
              {request.isHalfDay && (
                <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0 h-4">
                  Half Day
                </Badge>
              )}
              {request.isAnnualPlan && (
                <Badge variant="outline" className="text-[9px] uppercase font-semibold border-indigo-200 text-indigo-700 bg-indigo-50/60 px-1.5 py-0 h-4">
                  Annual Plan
                </Badge>
              )}
              {request.isPastLeave && (
                <Badge variant="outline" className="text-[9px] uppercase font-semibold border-amber-200 text-amber-700 bg-amber-50/60 px-1.5 py-0 h-4">
                  Past Leave
                </Badge>
              )}
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3 h-3 text-slate-400" />
                {request.selectedDates && request.selectedDates.length > 0 ? (
                  <span>{request.selectedDates.map((d) => format(safeDate(d), 'MMM d')).join(', ')}</span>
                ) : (
                  <span>
                    {format(safeDate(request.start_date || request.startDate), 'MMM d, yyyy')} -{' '}
                    {format(safeDate(request.end_date || request.endDate), 'MMM d, yyyy')}
                  </span>
                )}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/70 px-1.5 py-0.5 rounded text-[11px]">
                {request.total_days || request.totalDays || 0} {(request.total_days || request.totalDays) === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isPendingStatus && (
          <div className="flex items-center gap-2 pt-1 sm:pt-0 self-end sm:self-auto">
            {managerApproved ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Approved by Manager</span>
              </div>
            ) : (
              <>
                {onEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(request)}
                    disabled={isPending}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-[0.98] transition-all duration-150"
                    title="Edit request"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApprove(request)}
                  disabled={isPending}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 shadow-xs active:scale-[0.98] transition-all duration-150"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(request)}
                  disabled={isPending}
                  className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 font-medium text-xs px-3 active:scale-[0.98] transition-all duration-150"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Prominently Highlighted Section: Relief Officer & Handover Confirmation */}
      {hasReliefOfficer ? (
        <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/80 via-indigo-50/40 to-slate-50/60 border border-indigo-100/90 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-900">
                Relief Officer: <span className="text-indigo-900 font-bold">{reliefOfficerName}</span>
              </span>
            </div>

            {/* Handover Status Badge */}
            <div className="flex items-center gap-1.5">
              {reliefStatus === 'CONFIRMED' && (
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50/90 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                  Handover Confirmed ✓
                </Badge>
              )}
              {reliefStatus === 'REJECTED' && (
                <Badge variant="outline" className="text-rose-700 bg-rose-50/90 border-rose-200 text-[10px] font-semibold px-2 py-0.5">
                  Handover Declined ✗
                </Badge>
              )}
              {reliefStatus === 'PENDING' && (
                <Badge variant="outline" className="text-amber-700 bg-amber-50/90 border-amber-200 text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Awaiting Relief Confirmation
                </Badge>
              )}
            </div>
          </div>

          {/* Handover Note & Documents */}
          {handoverNote && (
            <div className="p-2.5 rounded-lg bg-white/95 border border-indigo-100/80 text-xs text-slate-700 shadow-2xs">
              <span className="font-semibold text-indigo-950 block mb-0.5 text-[11px] uppercase tracking-wider">
                Handover Instructions:
              </span>
              <p className="whitespace-pre-wrap leading-relaxed">{handoverNote}</p>
            </div>
          )}

          {handoverNoteUrl && (
            <div className="pt-0.5">
              <a
                href={handoverNoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-indigo-700 hover:bg-indigo-100/70 border border-indigo-200 font-medium text-xs transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>View Completed Handover Document</span>
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Unified Standard Coverage Box when Relief Officer is not assigned/required */
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="p-1 rounded-md bg-slate-200 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span>
              Relief Officer: <span className="font-medium text-slate-700">Not required for this leave</span>
            </span>
          </div>
          <Badge variant="outline" className="text-slate-600 bg-white border-slate-200 text-[10px] font-medium self-start sm:self-auto">
            Direct Handover / Coverage
          </Badge>
        </div>
      )}

      {/* Reason for Leave */}
      {request.reason && (
        <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="leading-relaxed">
            <strong className="text-slate-800">Reason:</strong> "{request.reason}"
          </span>
        </div>
      )}

      {/* General Supporting Attachment */}
      {attachmentUrl && (
        <div className="pt-0.5">
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>View Supporting Attachment</span>
          </a>
        </div>
      )}
    </div>
  );
}
