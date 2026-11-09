import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Button } from '@/components/ui/button';
import { Plane, CheckCircle2, Calendar, UserCheck, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeDashboardHeader({
  user,
  employee,
  pendingTasksCount = 0,
  isDraft = false,
  isPendingApproval = false,
  onNavigateTab,
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName =
    employee?.full_name?.split(' ')[0] ||
    user?.fullName?.split(' ')[0] ||
    user?.name?.split(' ')[0] ||
    'there';

  const currentDateStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const jobTitle = employee?.job_title || employee?.jobTitle || 'Employee';
  const department = employee?.department_id || employee?.department?.name || '';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {displayName}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <UserCheck className="w-3 h-3 text-blue-600" />
            <span>Employee Portal</span>
          </span>
          {employee?.employment_status && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {employee.employment_status}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateStr}</span>
          <span className="text-slate-300">•</span>
          <span>{jobTitle}{department ? ` (${department})` : ''}</span>
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {pendingTasksCount > 0 && (
          <Link to={PAGE_ROUTES.TASK_MANAGER}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 border-amber-200 bg-amber-50/60 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-medium gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingTasksCount} Tasks Due</span>
            </Button>
          </Link>
        )}

        {isDraft && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab ? onNavigateTab('profile') : null}
            className="h-9 px-3.5 border-blue-200 bg-blue-50/60 text-blue-900 hover:bg-blue-100 rounded-lg text-xs font-medium gap-1.5 transition-colors shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Complete Profile</span>
          </Button>
        )}

        <Link to={PAGE_ROUTES.LEAVE_MANAGEMENT}>
          <Button
            size="sm"
            className="h-9 px-4 text-xs font-medium text-white transition-all rounded-lg shadow-sm bg-slate-900 hover:bg-slate-800 gap-1.5"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Request Leave</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

