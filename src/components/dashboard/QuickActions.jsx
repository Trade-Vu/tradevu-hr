import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { UserPlus, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

const actions = [
  {
    title: 'Add Employee',
    description: 'Onboard team member',
    icon: UserPlus,
    url: `${PAGE_ROUTES.EMPLOYEES}?action=add`,
  },
  {
    title: 'Review Approvals',
    description: 'Manage pending queues',
    icon: CheckCircle2,
    url: PAGE_ROUTES.PENDING_APPROVALS,
  },
  {
    title: 'Run Payroll',
    description: 'Calculate & disburse',
    icon: DollarSign,
    url: PAGE_ROUTES.PAYROLL,
  },
  {
    title: 'Leave Calendar',
    description: 'Track staff time-off',
    icon: Calendar,
    url: PAGE_ROUTES.LEAVE_MANAGEMENT,
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <Link key={action.title} to={action.url} className="group focus:outline-none">
            <CardSpotlight
              radius={240}
              color="rgba(79, 70, 229, 0.05)"
              borderColor="rgba(79, 70, 229, 0.2)"
              className="h-full p-3.5 sm:p-4 bg-white border-slate-200/80 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate group-hover:text-primary-100 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardSpotlight>
          </Link>
        );
      })}
    </div>
  );
}