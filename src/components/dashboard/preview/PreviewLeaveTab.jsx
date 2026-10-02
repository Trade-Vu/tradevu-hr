import React from 'react';
import { Calendar, Clock, CheckCircle2, Umbrella, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PreviewLeaveTab({ employee, balances = [], isLoading = false }) {
  const isCurrentlyOnLeave = (employee?.employment_status || employee?.employmentStatus) === 'ON_LEAVE';

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Fetching real-time balances...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Current Presence Status */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isCurrentlyOnLeave
          ? 'bg-purple-50/70 border-purple-200/80 text-purple-900'
          : 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isCurrentlyOnLeave ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Umbrella className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">
              Attendance & Leave Status
            </p>
            <p className="text-sm font-medium mt-0.5">
              {isCurrentlyOnLeave ? 'Currently Out on Approved Leave' : 'Active & Available on Duty'}
            </p>
          </div>
        </div>

        <Badge variant="outline" className={
          isCurrentlyOnLeave 
            ? 'bg-purple-100/80 text-purple-800 border-purple-300' 
            : 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
        }>
          {isCurrentlyOnLeave ? 'On Leave' : 'Present'}
        </Badge>
      </div>

      {/* Leave Balances Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Accrued Leave Entitlements</span>
        </h4>

        {balances.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {balances.map((item, index) => {
              const allocated = Number(item.total ?? item.allocated ?? 0);
              const used = Number(item.used ?? 0);
              const remaining = Number(item.remaining ?? (allocated - used));
              const percentRemaining = allocated > 0 ? Math.round((remaining / allocated) * 100) : 100;

              return (
                <div 
                  key={item.leaveTypeId || index} 
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-slate-900 text-xs truncate">
                      {item.leaveType || item.name || 'Standard Leave'}
                    </p>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                      {remaining} days left
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentRemaining < 20 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, percentRemaining))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Used: {used}d</span>
                      <span>Total: {allocated}d</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">Standard leave allocations active</p>
            <p className="text-[11px] text-slate-400">
              Detailed breakdown accessible on full employee detail page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
