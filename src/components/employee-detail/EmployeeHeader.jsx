import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase, Mail, Shield, ShieldCheck, MoreVertical
} from "lucide-react";
import { isEmployeeEligibleForHrAdmin } from "./employeeDetailUtils";

export default function EmployeeHeader({
  employee,
  user,
  isSuperAdmin,
  onReassignHrAdmin,
  onPromote,
  onSuspend,
  onProbation,
  onOffboard,
}) {
  const isEligibleForHr = isEmployeeEligibleForHrAdmin(employee);

  return (
    <div className="relative text-white border-b bg-slate-900 border-slate-800">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 rounded-full w-80 h-80 bg-blue-500/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center md:p-8">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-20 h-20 overflow-hidden border shadow-xl bg-slate-800 rounded-2xl border-slate-700 shrink-0">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt={employee.full_name} className="object-cover w-full h-full" />
            ) : (
              <span className="text-3xl font-bold text-indigo-400">
                {employee.full_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold tracking-tight text-white">{employee.full_name}</h2>
              {employee.isHrAdmin && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-2.5 py-0.5 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> HR Admin
                </Badge>
              )}
              {employee.isSuperAdmin && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs px-2.5 py-0.5 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Super Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm">
                <Briefcase className="w-4 h-4" /> {employee.job_title}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span className="flex items-center gap-1.5 text-sm">
                <Mail className="w-4 h-4" /> {employee.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSuperAdmin && !employee.isSuperAdmin && isEligibleForHr && (
            <Button
              size="sm"
              variant={employee.isHrAdmin ? "outline" : "default"}
              className={
                employee.isHrAdmin
                  ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30 hover:text-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }
              onClick={onReassignHrAdmin}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {employee.isHrAdmin ? 'Reassign HR Admin' : 'Reassign as HR Admin'}
            </Button>
          )}

          {['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Employee Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isSuperAdmin && !employee.isSuperAdmin && isEligibleForHr && (
                  <>
                    <DropdownMenuItem
                      onClick={onReassignHrAdmin}
                      className="font-medium text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {employee.isHrAdmin ? 'Reassign HR Admin Role' : 'Reassign as HR Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {employee.employment_status === 'ACTIVE' && (
                  <DropdownMenuItem onClick={onPromote}>
                    Promote Employee
                  </DropdownMenuItem>
                )}
                {employee.employment_status !== 'SUSPENDED' && (
                  <DropdownMenuItem onClick={onSuspend} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                    Suspend Employee
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onProbation}>
                  Place on Probation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOffboard} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  Offboard Employee
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
