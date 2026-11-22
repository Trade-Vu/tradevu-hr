import React from 'react';
import { formatLeaveStatus, normalizeLeaveStatus, LEAVE_STATUS } from '@/lib/leaveStatus';

/**
 * World-standard, Apple-grade status indicator pill with a clean pastel container,
 * crisp border, and a subtle glowing accent dot.
 */
export default function LeaveStatusPill({ status, className = '' }) {
  const normalized = normalizeLeaveStatus(status);
  const label = formatLeaveStatus(status);

  let dotColor = 'bg-amber-500';
  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50';

  if (normalized === LEAVE_STATUS.APPROVED) {
    dotColor = 'bg-emerald-500';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50';
  } else if (normalized === LEAVE_STATUS.REJECTED) {
    dotColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50';
  } else if (normalized === LEAVE_STATUS.CANCELLED) {
    dotColor = 'bg-slate-400';
    badgeColor = 'bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800/50';
  } else if (normalized === LEAVE_STATUS.NEEDS_INFORMATION) {
    dotColor = 'bg-blue-500';
    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-tight whitespace-nowrap border shadow-2xs ${badgeColor} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
