import React from 'react';
import { Plane, Clock, DollarSign, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { format } from 'date-fns';

export default function EmployeeMetricsGrid({
  totalLeaveRemaining = 0,
  monthAttendance = [],
  latestPayroll = null,
  pendingTasksCount = 0,
  onNavigateTab,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse border border-slate-200/60" />
        ))}
      </div>
    );
  }

  const daysPresent = monthAttendance.filter((item) => item.status === 'present').length;
  const daysLate = monthAttendance.filter((item) => item.status === 'late').length;
  const currentMonthName = format(new Date(), 'MMMM');

  const payrollDisplay = latestPayroll?.net_salary
    ? `${Number(latestPayroll.net_salary).toLocaleString()} SAR`
    : 'Up to date';

  const payrollSubtext = latestPayroll?.month
    ? `Cycle ${latestPayroll.month}`
    : 'Payroll statements';

  const metrics = [
    {
      title: 'Available Leave',
      value: `${totalLeaveRemaining} Days`,
      subtext: 'Current remaining allowance',
      icon: Plane,
      trend: totalLeaveRemaining > 0 ? 'Plan vacation' : 'Allowance exhausted',
      tabKey: 'leave',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    },
    {
      title: 'Days Present',
      value: `${daysPresent} Days`,
      subtext: `Logged for ${currentMonthName}`,
      icon: Clock,
      trend: daysLate > 0 ? `${daysLate} late shifts` : 'Consistent shifts',
      tabKey: 'attendance',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    {
      title: 'Latest Payslip',
      value: payrollDisplay,
      subtext: payrollSubtext,
      icon: DollarSign,
      trend: latestPayroll?.status ? latestPayroll.status.toUpperCase() : 'Settled',
      tabKey: 'payslips',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
    },
    {
      title: 'Action Queue',
      value: pendingTasksCount,
      subtext: pendingTasksCount > 0 ? 'Pending to-dos & forms' : 'All requirements met',
      icon: CheckCircle2,
      trend: pendingTasksCount > 0 ? 'Action required' : 'Zero backlog',
      tabKey: 'onboarding',
      badgeColor: pendingTasksCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-slate-50 text-slate-700 border-slate-200/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            onClick={() => onNavigateTab ? onNavigateTab(item.tabKey) : null}
            className="group block focus:outline-none cursor-pointer"
          >
            <CardSpotlight
              radius={280}
              color="rgba(79, 70, 229, 0.06)"
              borderColor="rgba(79, 70, 229, 0.25)"
              className="h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-slate-200/80 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  {item.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-heading">
                    {item.value}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 truncate max-w-[130px] sm:max-w-none">
                    {item.subtext}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${item.badgeColor}`}>
                    {item.trend}
                  </span>
                </div>
              </div>
            </CardSpotlight>
          </div>
        );
      })}
    </div>
  );
}

