import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardHeader({ user, totalPendingApprovals }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
  const currentDateStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {displayName}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
            Overview
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDateStr}</span>
          <span className="text-slate-300">•</span>
          <span>Live Workforce Pulse</span>
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {totalPendingApprovals > 0 && (
          <Link to={PAGE_ROUTES.PENDING_APPROVALS}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3.5 border-amber-200 bg-amber-50/60 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-medium gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalPendingApprovals} Pending Review</span>
            </Button>
          </Link>
        )}

        <Link to={`${PAGE_ROUTES.EMPLOYEES}?action=add`}>
          <Button
            size="sm"
            className="h-9 px-4 text-xs font-medium text-white transition-all rounded-lg shadow-sm bg-slate-900 hover:bg-slate-800 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add employee</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
