import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { format } from 'date-fns';

export default function OutOfOfficeWidget({ onLeaveList = [] }) {
  return (
    <Card className="border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 font-heading">
          <CalendarDays className="w-4 h-4 text-primary-100" />
          <span>Out of Office Today</span>
          {onLeaveList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
              {onLeaveList.length}
            </span>
          )}
        </CardTitle>
        <Link
          to={PAGE_ROUTES.LEAVE_MANAGEMENT}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-0.5 font-medium"
        >
          Calendar <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {onLeaveList.length === 0 ? (
          <div className="p-5 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">Full Team Present</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No approved absences scheduled for today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto custom-scrollbar">
            {onLeaveList.map((leave, idx) => {
              const empName = leave.employeeId?.fullName || leave.employeeName || 'Team Member';
              const leaveType = leave.leaveTypeId?.name || leave.leaveType || 'Leave';
              const returnDate = leave.endDate ? format(new Date(leave.endDate), 'MMM d') : 'Soon';

              return (
                <div key={idx} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-heading font-semibold text-xs flex items-center justify-center shrink-0">
                      {empName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{empName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{leaveType}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    Returns {returnDate}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
