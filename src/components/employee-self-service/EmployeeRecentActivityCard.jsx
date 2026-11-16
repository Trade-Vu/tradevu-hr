import React, { useState } from 'react';
import { Plane, Receipt, DollarSign, ArrowRight, Clock, CheckCircle2, ChevronRight, FileText, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { formatLeaveStatus, getLeaveStatusBadgeClass } from '@/lib/leaveStatus';

export default function EmployeeRecentActivityCard({
  leaveRequests = [],
  expenses = [],
  payrolls = [],
  onNavigateTab,
  onDownloadPayslip,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Normalize leave items
  const leaveItems = leaveRequests.slice(0, 5).map((l) => ({
    id: `leave-${l.id}`,
    category: 'leave',
    icon: Plane,
    title: l.leave_type ? l.leave_type.replace(/_/g, ' ') : 'Leave Request',
    subtitle: `${l.start_date ? format(new Date(l.start_date), 'MMM d') : ''} - ${l.end_date ? format(new Date(l.end_date), 'MMM d, yyyy') : ''}`,
    date: l.createdAt || l.start_date,
    status: l.status,
    badgeClass: getLeaveStatusBadgeClass(l.status),
    statusText: formatLeaveStatus(l.status),
    tabKey: 'leave',
  }));

  // Normalize expense items
  const expenseItems = expenses.slice(0, 5).map((e) => {
    let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    if (e.status === 'approved' || e.status === 'reimbursed') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (e.status === 'rejected') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return {
      id: `expense-${e.id}`,
      category: 'expense',
      icon: Receipt,
      title: e.expense_type ? e.expense_type.replace(/_/g, ' ') : 'Expense Claim',
      subtitle: `${Number(e.amount || 0).toLocaleString()} ${e.currency || 'NGN'} • ${e.date ? format(new Date(e.date), 'MMM d, yyyy') : ''}`,
      date: e.date || e.createdAt,
      status: e.status,
      badgeClass,
      statusText: (e.status || 'pending').toUpperCase(),
      tabKey: 'expenses',
    };
  });

  // Normalize payslip items
  const payslipItems = payrolls.slice(0, 3).map((p) => ({
    id: `payroll-${p.id}`,
    category: 'payroll',
    icon: DollarSign,
    title: `Payslip • ${p.month}`,
    subtitle: `Net Salary: ${Number(p.net_salary || 0).toLocaleString()} SAR`,
    date: p.createdAt || new Date(),
    status: p.status,
    badgeClass: p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
    statusText: (p.status || 'Settled').toUpperCase(),
    tabKey: 'payslips',
    rawItem: p,
  }));

  // Combined list sorted by date (newest first)
  const combinedItems = [...leaveItems, ...expenseItems, ...payslipItems].sort((a, b) => {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  const displayedItems =
    activeFilter === 'leave'
      ? leaveItems
      : activeFilter === 'expense'
      ? expenseItems
      : activeFilter === 'payroll'
      ? payslipItems
      : combinedItems.slice(0, 6);

  return (
    <Card className="border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 font-heading">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Recent Requests & Activity</span>
          </CardTitle>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
            {combinedItems.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'leave', label: 'Leave' },
            { id: 'expense', label: 'Expenses' },
            { id: 'payroll', label: 'Payslips' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {displayedItems.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">No requests in this category</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              You haven't submitted any {activeFilter === 'all' ? 'requests' : activeFilter} recently.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigateTab ? onNavigateTab(item.tabKey) : null}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors capitalize">
                        {item.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${item.badgeClass}`}>
                      {item.statusText}
                    </span>
                    {item.category === 'payroll' && onDownloadPayslip && (
                      <button
                        type="button"
                        title="Download PDF payslip"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadPayslip(item.rawItem);
                        }}
                        className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

