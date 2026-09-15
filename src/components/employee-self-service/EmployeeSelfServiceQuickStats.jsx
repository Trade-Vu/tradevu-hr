import React from 'react';
import { Calendar, CheckCircle, Laptop, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const statStyles = {
  leave: { icon: Calendar, iconClass: 'text-indigo-600', background: 'bg-indigo-100/50 border-indigo-200/50' },
  attendance: { icon: CheckCircle, iconClass: 'text-emerald-600', background: 'bg-emerald-100/50 border-emerald-200/50' },
  assets: { icon: Laptop, iconClass: 'text-blue-600', background: 'bg-blue-100/50 border-blue-200/50' },
  expenses: { icon: Receipt, iconClass: 'text-amber-600', background: 'bg-amber-100/50 border-amber-200/50' },
};

export default function EmployeeSelfServiceQuickStats({ stats, onLeaveClick }) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {stats.map(({ key, value, label, clickable }) => {
        const style = statStyles[key];
        const Icon = style.icon;
        return (
          <Card
            key={key}
            className={`overflow-hidden rounded-2xl border-slate-200/60 bg-white/70 shadow-sm backdrop-blur-md ${clickable ? 'cursor-pointer transition-colors hover:border-indigo-300' : ''}`}
            onClick={clickable ? onLeaveClick : undefined}
          >
            <CardContent className="p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${style.background}`}>
                <Icon className={`h-6 w-6 ${style.iconClass}`} />
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
