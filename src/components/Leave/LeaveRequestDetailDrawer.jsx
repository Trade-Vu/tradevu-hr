import React from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  FileText,
  Paperclip,
  CheckCircle2,
  XCircle,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isPendingLeaveStatus } from '@/lib/leaveStatus';
import LeaveStatusPill from './LeaveStatusPill';

const getInitials = (name) => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function LeaveRequestDetailDrawer({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onEdit,
  canTakeAction = true,
  managerApproved = false,
}) {
  if (!request) return null;

  const employeeName = request.employee_name || request.employeeId?.fullName || request.employeeId?.name || 'Employee';
  const employeeEmail = request.employee_email || request.employeeId?.email || '';
  const departmentName = request.department_name || request.employeeId?.departmentId?.name || request.employeeId?.department?.name || '';
  const leaveTypeName = (request.leave_type || request.leaveTypeId?.name || 'Leave').replace(/_/g, ' ');
  const days = request.total_days ?? request.totalDays ?? 0;
  const attachmentUrl = request.attachment_url || request.attachmentUrl;
  const isPending = isPendingLeaveStatus(request.status);
  const initials = getInitials(employeeName);

  const reliefOfficerName = request.relief_officer_name || request.reliefOfficerId?.fullName || request.reliefOfficerId?.name;
  const reliefStatus = request.relief_officer_status || request.reliefOfficerStatus;
  const handoverNote = request.handover_note || request.handoverNote;
  const handoverNoteUrl = request.handover_note_url || request.handoverNoteUrl;
  const hasReliefOfficer = Boolean(reliefOfficerName);

  const safeFormatDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      return format(new Date(dateVal), 'MMM d, yyyy');
    } catch {
      return String(dateVal);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-white">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="space-y-0.5">
                <SheetTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{employeeName}</span>
                  {!canTakeAction && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                      You
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  {departmentName && <span>{departmentName} • </span>}
                  {employeeEmail || 'Employee'}
                </SheetDescription>
              </div>
            </div>
            <LeaveStatusPill status={request.status} />
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Leave Overview Box */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-900 capitalize">{leaveTypeName}</span>
                {request.isHalfDay && (
                  <Badge variant="secondary" className="text-[10px] bg-slate-200/70 text-slate-700">
                    Half Day
                  </Badge>
                )}
                {request.isAnnualPlan && (
                  <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50/60 font-medium">
                    Annual Plan
                  </Badge>
                )}
                {request.isPastLeave && (
                  <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50/60 font-medium">
                    Past Leave
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Duration
              </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {days} {days === 1 ? 'working day' : 'working days'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Dates Requested</span>
              <span className="font-medium text-slate-800 text-right">
                {request.selectedDates && request.selectedDates.length > 0
                  ? request.selectedDates.map((d) => safeFormatDate(d)).join(', ')
                  : `${safeFormatDate(request.start_date || request.startDate)} – ${safeFormatDate(request.end_date || request.endDate)}`}
              </span>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Reason
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs leading-relaxed">
              {request.reason ? (
                <p className="whitespace-pre-wrap">{request.reason}</p>
              ) : (
                <p className="italic text-slate-400">No specific reason provided</p>
              )}
            </div>
          </div>

          {/* Supporting Document Section */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" /> Supporting Document
            </h4>
            {attachmentUrl ? (
              <div className="p-3 rounded-xl border border-blue-200/70 bg-blue-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900 truncate">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">Supporting Document Attached</span>
                </div>
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs shrink-0"
                >
                  <span>Open File</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic px-1">No document attached / not required</p>
            )}
          </div>

          {/* Relief Officer & Handover */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Coverage & Handover
            </h4>
            {hasReliefOfficer ? (
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Relief Officer:</span>
                  <span className="font-bold text-indigo-900">{reliefOfficerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-100/70">
                  <span className="text-slate-600">Handover Status:</span>
                  {reliefStatus === 'CONFIRMED' && (
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px]">
                      Confirmed ✓
                    </Badge>
                  )}
                  {reliefStatus === 'REJECTED' && (
                    <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200 text-[10px]">
                      Declined ✗
                    </Badge>
                  )}
                  {reliefStatus === 'PENDING' && (
                    <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Awaiting Confirmation
                    </Badge>
                  )}
                </div>
                {handoverNote && (
                  <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5 text-[11px]">Instructions:</span>
                    <p className="whitespace-pre-wrap">{handoverNote}</p>
                  </div>
                )}
                {handoverNoteUrl && (
                  <a
                    href={handoverNoteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline pt-0.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Handover Document</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Relief Officer not required for this request</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>

          {isPending && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {!canTakeAction ? (
                <span className="text-xs text-slate-500 italic">You submitted this request</span>
              ) : managerApproved ? (
                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Manager
                </span>
              ) : (
                <>
                  {onEdit && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onClose();
                        onEdit(request);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      onClose();
                      onReject(request);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      onClose();
                      onApprove(request);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
