import React from 'react';
import { Check, CheckCircle2, ChevronRight, Paperclip, X } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { isPendingLeaveStatus } from '@/lib/leaveStatus';
import LeaveStatusPill from './LeaveStatusPill';
import { getLeaveEmployeeName, getLeaveEmployeeInitials } from './leaveEmployeeUtils';

const getLeaveTypeName = (leave) =>
  (leave.leave_type || leave.leaveTypeId?.name || 'Annual Leave').replace(/_/g, ' ');

export default function LeaveRequestTableRow({
  leave,
  onSelect,
  onRequestAction,
  canTakeAction,
  isManagerOnly,
  hasManagerApproved,
  getRequestDates,
  safeDate,
}) {
  const actionable = canTakeAction(leave);
  const isPending = isPendingLeaveStatus(leave.status);
  const managerHasApproved = hasManagerApproved(leave) && isManagerOnly;
  const days = leave.total_days ?? leave.totalDays ?? 0;
  const employeeName = getLeaveEmployeeName(leave);
  const deptOrEmail = leave.department_name || leave.employeeId?.departmentId?.name || leave.employee_email;
  const hasDoc = Boolean(leave.attachment_url || leave.attachmentUrl);

  return (
    <TableRow
      onClick={() => onSelect(leave)}
      className="cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors duration-150 group border-b border-slate-100/80"
    >
      {/* Employee */}
      <TableCell className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100/80 border border-indigo-200/60 text-indigo-700 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {getLeaveEmployeeInitials(employeeName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                {employeeName}
              </span>
              {!actionable && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 shrink-0">
                  You
                </span>
              )}
            </div>
            {deptOrEmail && (
              <div className="text-xs text-slate-500 font-normal truncate mt-0.5">
                {deptOrEmail}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Leave Type */}
      <TableCell className="py-4">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-medium text-slate-900 text-sm capitalize">
            {getLeaveTypeName(leave)}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {leave.isHalfDay && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                Half day
              </span>
            )}
            {leave.isPastLeave && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                Past leave
              </span>
            )}
            {hasDoc && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                title="Supporting document attached"
              >
                <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                Proof attached
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Days */}
      <TableCell className="py-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-slate-100/90 text-slate-700 border border-slate-200/80 shadow-2xs">
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4">
        <div className="flex items-center">
          <LeaveStatusPill status={leave.status} />
        </div>
      </TableCell>

      {/* Actions & Drilldown affordance */}
      <TableCell className="py-4 text-right pr-4 min-w-[190px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2.5">
          {isPending && actionable && managerHasApproved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 whitespace-nowrap shrink-0 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Manager Approved</span>
            </span>
          ) : isPending && actionable ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs border border-emerald-200/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAction(leave, 'approve');
                }}
                aria-label={`Approve ${employeeName}'s request`}
                title="Approve request"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all shadow-2xs border border-rose-200/80"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestAction(leave, 'reject');
                }}
                aria-label={`Reject ${employeeName}'s request`}
                title="Reject request"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : null}

          {/* Trailing drill-down chevron */}
          <button
            type="button"
            onClick={() => onSelect(leave)}
            className="p-1 rounded-md text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 focus:outline-hidden"
            aria-label={`View details for ${employeeName}'s request`}
            title="View request details"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
