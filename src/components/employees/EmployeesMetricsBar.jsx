import React from 'react';
import { Users, UserCheck, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

export default function EmployeesMetricsBar({
  stats = {},
  currentFilter = 'all',
  onSelectFilter,
  isLoading = false,
}) {
  const total = stats.total ?? 0;
  const active = stats.active ?? 0;
  const onboarding = stats.onboarding ?? 0;
  const onLeave = stats.onLeave ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse border border-slate-200/60" />
        ))}
      </div>
    );
  }

  const items = [
    {
      id: 'all',
      title: 'Total Headcount',
      value: total,
      subtext: 'Organizational roster',
      icon: Users,
      color: 'blue',
      activeBorder: 'border-indigo-600 bg-indigo-50/20',
    },
    {
      id: 'ACTIVE',
      title: 'Active Personnel',
      value: active,
      subtext: `${total > 0 ? Math.round((active / total) * 100) : 100}% of workforce`,
      icon: UserCheck,
      color: 'emerald',
      activeBorder: 'border-emerald-600 bg-emerald-50/20',
    },
    {
      id: 'PENDING_ONBOARDING',
      title: 'In Onboarding',
      value: onboarding,
      subtext: onboarding > 0 ? 'Pending verification' : 'All staff onboarded',
      icon: Sparkles,
      color: 'amber',
      activeBorder: 'border-amber-600 bg-amber-50/20',
    },
    {
      id: 'ON_LEAVE',
      title: 'Out on Leave',
      value: onLeave,
      subtext: onLeave > 0 ? 'Approved time-off' : 'Full capacity on duty',
      icon: Calendar,
      color: 'purple',
      activeBorder: 'border-purple-600 bg-purple-50/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isSelected = currentFilter === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(item.id)}
            className="text-left w-full focus:outline-none"
          >
            <CardSpotlight
              radius={240}
              color="rgba(79, 70, 229, 0.05)"
              borderColor={isSelected ? 'rgba(79, 70, 229, 0.4)' : 'rgba(226, 232, 240, 0.8)'}
              className={`p-3.5 sm:p-4 rounded-xl bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${
                isSelected ? item.activeBorder + ' shadow-xs ring-1 ring-indigo-500/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {item.title}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  item.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-600'
                    : item.color === 'amber'
                    ? 'bg-amber-50 text-amber-600'
                    : item.color === 'purple'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
                  {item.value}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {item.subtext}
                </span>
              </div>
            </CardSpotlight>
          </button>
        );
      })}
    </div>
  );
}
