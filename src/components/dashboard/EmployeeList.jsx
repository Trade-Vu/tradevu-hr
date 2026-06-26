import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Mail, Briefcase, UserPlus } from "lucide-react";

const statusColors = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  INACTIVE: "bg-slate-50 text-slate-600 border-slate-200",
  ON_LEAVE: "bg-amber-50 text-amber-600 border-amber-200",
  TERMINATED: "bg-red-50 text-red-600 border-red-200",
  PENDING_ONBOARDING: "bg-blue-50 text-blue-600 border-blue-200",
  ONGOING_ONBOARDING: "bg-indigo-50 text-indigo-600 border-indigo-200",
  not_started: "bg-slate-50 text-slate-600 border-slate-200",
  in_progress: "bg-blue-50 text-blue-600 border-blue-200",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
  PENDING_ONBOARDING: "Pending Onboarding",
  ONGOING_ONBOARDING: "Ongoing Onboarding",
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function EmployeeList({ employees, isLoading, onOpenDetail }) {
  if (isLoading) {
    return (
      <div className="divide-y divide-slate-100">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 animate-pulse">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-4 bg-slate-100 rounded w-16" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
              <div className="pt-1">
                <div className="h-1.5 bg-slate-100 rounded-full w-full" />
              </div>
            </div>
            <div className="w-5 h-5 bg-slate-100 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl mb-4 flex items-center justify-center">
          <Briefcase className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No employees yet</h3>
        <p className="text-sm text-slate-500 mb-6">Start by adding your first new hire</p>
        <Link to={createPageUrl("Employees?action=add")}>
          <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add New Hire
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {employees.map((employee, i) => (
        <div
          key={employee.id}
          onClick={() => onOpenDetail ? onOpenDetail(employee.id) : null}
          className="block p-5 hover:bg-slate-50 transition-colors group relative cursor-pointer"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium text-sm flex-shrink-0 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
              {employee.full_name.charAt(0).toUpperCase()}
            </div>

            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm text-slate-900 truncate">
                  {employee.full_name}
                </h3>
                {employee.employeeCode && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {employee.employeeCode}
                  </span>
                )}
                <Badge variant="outline" className={`${statusColors[employee.employment_status || employee.onboarding_status] || 'bg-slate-50 text-slate-600 border-slate-200'} font-medium border text-[10px] py-0 h-5`}>
                  {statusLabels[employee.employment_status || employee.onboarding_status] || employee.employment_status || employee.onboarding_status || 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{employee.job_title}</span>
                  {employee.department_name && <span className="text-slate-400"> • {employee.department_name}</span>}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{employee.email}</span>
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  <span>Progress</span>
                  <span className={employee.progress_percentage === 100 ? "text-green-600" : ""}>{employee.progress_percentage || 0}%</span>
                </div>
                <Progress value={employee.progress_percentage || 0} className="h-1.5 bg-slate-100" />
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}