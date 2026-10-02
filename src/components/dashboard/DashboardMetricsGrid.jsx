import React from 'react';
import { Users, Calendar, DollarSign, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';

export default function DashboardMetricsGrid({
  totalEmployees = 0,
  activeEmployees = 0,
  onLeaveTodayCount = 0,
  latestPayrollRun = null,
  totalPendingApprovals = 0,
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

  const payrollStatusLabel = latestPayrollRun
    ? latestPayrollRun.status?.toUpperCase() || 'ACTIVE'
    : 'UP TO DATE';

  const payrollRunName = latestPayrollRun?.title || latestPayrollRun?.period || 'Current Cycle';

  const metrics = [
    {
      title: 'Active Workforce',
      value: totalEmployees,
      subtext: `${activeEmployees} active personnel`,
      icon: Users,
      trend: '+4% this month',
      color: 'blue',
      href: PAGE_ROUTES.EMPLOYEES,
    },
    {
      title: 'Out of Office Today',
      value: onLeaveTodayCount,
      subtext: onLeaveTodayCount > 0 ? 'Approved leave requests' : 'All team members present',
      icon: Calendar,
      trend: onLeaveTodayCount > 0 ? 'Coverages assigned' : 'Full capacity',
      color: 'amber',
      href: PAGE_ROUTES.LEAVE_MANAGEMENT,
    },
    {
      title: 'Payroll Cycle',
      value: payrollStatusLabel,
      subtext: payrollRunName,
      icon: DollarSign,
      trend: 'Automated tax calc',
      color: 'emerald',
      href: PAGE_ROUTES.PAYROLL,
    },
    {
      title: 'Action Queue',
      value: totalPendingApprovals,
      subtext: totalPendingApprovals > 0 ? 'Requires attention' : 'All queues cleared',
      icon: Clock,
      trend: totalPendingApprovals > 0 ? 'Pending sign-off' : 'Zero backlog',
      color: 'purple',
      href: PAGE_ROUTES.PENDING_APPROVALS,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {metrics.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Link key={idx} to={item.href} className="group block focus:outline-none">
            <CardSpotlight
              radius={280}
              color="rgba(79, 70, 229, 0.06)"
              borderColor="rgba(79, 70, 229, 0.25)"
              className="h-full p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer border-slate-200/80 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-400 group-hover:text-slate-700 flex items-center gap-0.5 transition-colors">
                  View <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 tracking-tight truncate mb-1">
                  {item.title}
                </p>
                <div className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">
                  {item.value}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
                  {item.subtext}
                </p>
              </div>
            </CardSpotlight>
          </Link>
        );
      })}
    </div>
  );
}
