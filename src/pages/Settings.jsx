import React from "react";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon,
  FolderArchive,
  CheckCircle,
  Clock,
  Users,
  BookTemplate,
  CalendarRange,
  Calendar,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { PAGE_ROUTES } from "@/constants/pageRoutes";

const SETTINGS_SECTIONS = [
  {
    title: "Company Library",
    description: "Manage folders, upload company templates/policies, and configure attribute-based access rules.",
    url: PAGE_ROUTES.SETTINGS_COMPANY_LIBRARY,
    icon: FolderArchive,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    title: "Approval Workflows",
    description: "Multi-step sign-off chains for leave, promotions, offboarding, and payroll.",
    url: PAGE_ROUTES.SETTINGS_APPROVAL_WORKFLOWS,
    icon: CheckCircle,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    title: "Onboarding Templates",
    description: "Standard milestone checklists, required paperwork, and task templates for new hires.",
    url: PAGE_ROUTES.TEMPLATES,
    icon: BookTemplate,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    title: "Departments",
    description: "Manage organizational units, department codes, and department heads.",
    url: PAGE_ROUTES.SETTINGS_DEPARTMENTS,
    icon: Users,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    title: "Work Shifts",
    description: "Configure work timings, grace periods, and break policies.",
    url: PAGE_ROUTES.SETTINGS_SHIFTS,
    icon: Clock,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    title: "Leave Types",
    description: "Accrual policies, allocation rules, and gender restrictions.",
    url: PAGE_ROUTES.SETTINGS_LEAVE_TYPES,
    icon: CalendarRange,
    color: "text-teal-600 bg-teal-50 border-teal-200",
  },
  {
    title: "Public Holidays",
    description: "Statutory calendar dates and automatic working day exclusions.",
    url: PAGE_ROUTES.SETTINGS_PUBLIC_HOLIDAYS,
    icon: Calendar,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    title: "Audit Logs",
    description: "Immutable security trail of administrative actions and approvals.",
    url: PAGE_ROUTES.AUDIT_LOGS,
    icon: ShieldCheck,
    color: "text-slate-600 bg-slate-100 border-slate-200",
  },
];

export default function Settings() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-3">
          <SettingsIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">System Administration</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
          System & Organization Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Configure company resources, document library access, approval chains, work timing, and compliance parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.title}
              to={section.url}
              className="group bg-white border border-slate-200/90 hover:border-indigo-300 rounded-xl p-5 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-xl ${section.color} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-heading">
                    {section.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">
                <span className="font-medium text-[11px]">Configure settings</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}