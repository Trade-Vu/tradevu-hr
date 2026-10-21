import React from 'react';
import { Clock, Info } from 'lucide-react';

/**
 * LeaveBalanceIndicator displays the policy allocation, currently available days,
 * and any days currently awaiting approval.
 *
 * @param {Object} props
 * @param {number} props.allocatedDays - Policy entitlement days configured for employee.
 * @param {Object|null} props.selectedBalance - Normalized leave balance object.
 * @param {string} [props.className] - Additional CSS class names.
 */
export default function LeaveBalanceIndicator({
  allocatedDays,
  selectedBalance,
  className = "",
}) {
  const pendingDays = selectedBalance?.pending ?? 0;
  const availableDays = selectedBalance?.available;

  return (
    <div className={`space-y-1.5 pt-1 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
          Policy: {allocatedDays ?? 0} days configured
        </span>

        {typeof availableDays === "number" && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
              availableDays > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            Available: {availableDays} days remaining
          </span>
        )}

        {pendingDays > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            {pendingDays} {pendingDays === 1 ? 'day' : 'days'} pending approval
          </span>
        )}
      </div>

      {pendingDays > 0 && (
        <p className="text-[11px] text-amber-700/90 flex items-center gap-1.5 leading-snug">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {pendingDays} {pendingDays === 1 ? 'day is' : 'days are'} currently awaiting review and reserved from your balance.
          </span>
        </p>
      )}
    </div>
  );
}
