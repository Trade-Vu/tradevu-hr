import React from 'react';
import { Calendar, Clock, CheckCircle2, FileText } from 'lucide-react';

export default function LeaveTypesStatsOverview({ leaveTypes = [] }) {
  const paidCount = leaveTypes.filter((lt) => lt.isPaid).length;
  const noticeCount = leaveTypes.filter(
    (lt) => lt.hasNoticePeriod || (lt.noticePeriodDays > 0) || (lt.noticeDaysRequired > 0)
  ).length;
  const handoverCount = leaveTypes.filter(
    (lt) => lt.requiresHandover || lt.handoverRequirement === 'COMPULSORY'
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{leaveTypes.length}</div>
          <div className="text-xs text-slate-500 font-medium">Configured Types</div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{paidCount}</div>
          <div className="text-xs text-slate-500 font-medium">Paid Types</div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{noticeCount}</div>
          <div className="text-xs text-slate-500 font-medium">Notice Required</div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl font-bold text-slate-900">{handoverCount}</div>
          <div className="text-xs text-slate-500 font-medium">Handover Required</div>
        </div>
      </div>
    </div>
  );
}
