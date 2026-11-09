import React from 'react';
import { Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { Plane, Receipt, DollarSign, CheckSquare } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

export default function EmployeeQuickActions({ onNavigateTab }) {
  const actions = [
    {
      title: 'Request Leave',
      description: 'Book time off & vacations',
      icon: Plane,
      url: PAGE_ROUTES.LEAVE_MANAGEMENT,
      tab: 'leave',
    },
    {
      title: 'Submit Expense',
      description: 'Claim reimbursement',
      icon: Receipt,
      url: PAGE_ROUTES.EXPENSES,
      tab: 'expenses',
    },
    {
      title: 'View Payslips',
      description: 'Download PDF statements',
      icon: DollarSign,
      tab: 'payslips',
    },
    {
      title: 'My Tasks',
      description: 'Track to-do & checklist',
      icon: CheckSquare,
      url: PAGE_ROUTES.TASK_MANAGER,
      tab: 'onboarding',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        const content = (
          <CardSpotlight
            radius={240}
            color="rgba(79, 70, 229, 0.05)"
            borderColor="rgba(79, 70, 229, 0.2)"
            className="h-full p-3.5 sm:p-4 bg-white border-slate-200/80 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
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
        );

        if (action.url) {
          return (
            <Link key={action.title} to={action.url} className="group focus:outline-none">
              {content}
            </Link>
          );
        }

        return (
          <div
            key={action.title}
            onClick={() => onNavigateTab ? onNavigateTab(action.tab) : null}
            className="group focus:outline-none"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

