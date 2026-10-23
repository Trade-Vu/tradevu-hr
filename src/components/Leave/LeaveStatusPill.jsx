import React from 'react';
import { formatLeaveStatus, normalizeLeaveStatus, LEAVE_STATUS } from '@/lib/leaveStatus';

/**
 * Apple-style status indicator pill with a soft pastel tint and colored dot.
 */
export default function LeaveStatusPill({ status, className = '' }) {
  const normalized = normalizeLeaveStatus(status);
  const label = formatLeaveStatus(status);

  let dotColor = 'bg-amber-500';
  let badgeColor = 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';

  if (normalized === LEAVE_STATUS.APPROVED) {
    dotColor = 'bg-emerald-500';
    badgeColor = 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  } else if (normalized === LEAVE_STATUS.REJECTED) {
    dotColor = 'bg-rose-500';
    badgeColor = 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
  } else if (normalized === LEAVE_STATUS.CANCELLED) {
    dotColor = 'bg-slate-400';
    badgeColor = 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300';
  } else if (normalized === LEAVE_STATUS.NEEDS_INFORMATION) {
    dotColor = 'bg-blue-500';
    badgeColor = 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-tight whitespace-nowrap shadow-2xs ${badgeColor} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
      {label}
    </span>
  );
}
