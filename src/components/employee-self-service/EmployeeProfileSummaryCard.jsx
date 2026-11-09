import React from 'react';
import { User, Building, Briefcase, UserCheck, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function EmployeeProfileSummaryCard({ employee, onNavigateTab }) {
  if (!employee) return null;

  const initials = employee.full_name
    ? employee.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EM';

  const hireDateFormatted = employee.start_date
    ? format(new Date(employee.start_date), 'MMMM d, yyyy')
    : 'N/A';

  return (
    <Card className="border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 font-heading">
          <User className="w-4 h-4 text-blue-600" />
          <span>My Employment Overview</span>
        </CardTitle>
        <button
          onClick={() => onNavigateTab ? onNavigateTab('profile') : null}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 font-medium cursor-pointer"
        >
          View Full Profile <ArrowRight className="w-3 h-3" />
        </button>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-heading font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {employee.full_name || 'Team Member'}
              </h3>
              {employee.employment_status && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {employee.employment_status}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
              {employee.job_title || 'Employee'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Employee ID:</span>
              <span className="font-mono font-medium text-slate-700">{employee.employeeNumber || employee.id?.slice(-6) || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-medium">Department</p>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {employee.department_id || 'General Workforce'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-medium">Direct Manager</p>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {employee.manager_name || 'Direct Leadership'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-medium">Employment Type</p>
              <p className="text-xs font-semibold text-slate-800 truncate capitalize">
                {employee.employment_type || employee.employmentType || 'Permanent / Full-Time'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 font-medium">Joined Organization</p>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {hireDateFormatted}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

