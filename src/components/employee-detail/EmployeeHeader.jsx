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
  Briefcase,
  Mail,
  Shield,
  ShieldCheck,
  MoreVertical,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  UserX,
  Clock,
} from "lucide-react";
import { isEmployeeEligibleForHrAdmin } from "./employeeDetailUtils";
import { isOnboardedStatus, isSeparatedStatus, PRE_ONBOARDING_STATUSES } from "@/lib/employmentStatus";

const getStatusBadgeConfig = (statusUpper) => {
  switch (statusUpper) {
    case 'ACTIVE':
      return {
        label: 'Active',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    case 'OFFBOARDED':
      return {
        label: 'Offboarded',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotColor: 'bg-rose-400',
      };
    case 'TERMINATED':
      return {
        label: 'Terminated',
        className: 'bg-red-500/15 text-red-300 border-red-500/30',
        dotColor: 'bg-red-400',
      };
    case 'RESIGNED':
      return {
        label: 'Resigned',
        className: 'bg-slate-500/20 text-slate-300 border-slate-600/40',
        dotColor: 'bg-slate-400',
      };
    case 'SUSPENDED':
      return {
        label: 'Suspended',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'PROBATION':
      return {
        label: 'Probation',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        dotColor: 'bg-purple-400',
      };
    case 'PENDING_ONBOARDING':
      return {
        label: 'Pending Onboarding',
        className: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        dotColor: 'bg-blue-400',
      };
    case 'ONGOING_ONBOARDING':
      return {
        label: 'Ongoing Onboarding',
        className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dotColor: 'bg-indigo-400',
      };
    case 'PENDING_APPROVAL':
      return {
        label: 'Pending Approval',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        dotColor: 'bg-sky-400',
      };
    case 'DRAFT':
      return {
        label: 'Draft',
        className: 'bg-slate-500/20 text-slate-300 border-slate-600/40',
        dotColor: 'bg-slate-400',
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: 'bg-zinc-500/20 text-zinc-300 border-zinc-600/40',
        dotColor: 'bg-zinc-400',
      };
    default: {
      const formatted = statusUpper
        ? statusUpper
            .toLowerCase()
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Active';
      return {
        label: formatted,
        className: 'bg-slate-500/20 text-slate-300 border-slate-600/40',
        dotColor: 'bg-slate-400',
      };
    }
  }
};

export default function EmployeeHeader({
  employee,
  user,
  isSuperAdmin,
  onReassignHrAdmin,
  onPromote,
  onSuspend,
  onProbation,
  onOffboard,
  onReactivate,
  onResendInvite,
  isResendingInvite = false,
}) {
  const currentStatus = String(employee?.employment_status || employee?.employmentStatus || 'DRAFT').toUpperCase();
  const isOffboarded = isSeparatedStatus(currentStatus);
  const isActive = currentStatus === 'ACTIVE';
  const isSuspended = currentStatus === 'SUSPENDED';
  const isProbation = currentStatus === 'PROBATION';
  const isPreOnboarding = PRE_ONBOARDING_STATUSES.includes(currentStatus);

  const isUserActive = Boolean(employee?.userActive || employee?.isUserActive || employee?.isActive);
  const isFullyActive = isActive || (isUserActive && isOnboardedStatus(currentStatus));
  const statusBadge = getStatusBadgeConfig(currentStatus);

  const isEligibleForHr = isEmployeeEligibleForHrAdmin(employee);
  const canManageInvites = ['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) || Boolean(user?.isOrgOwner || user?.is_organization_owner);
  const canShowResendInvite = canManageInvites && !isFullyActive && !isOffboarded && isPreOnboarding && Boolean(onResendInvite);

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
              {statusBadge && (
                <Badge className={`${statusBadge.className} border text-xs px-2.5 py-0.5 font-semibold flex items-center gap-1.5 shadow-sm`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                  {statusBadge.label}
                </Badge>
              )}
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
          {canManageInvites && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Employee Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isOffboarded ? (
                  // Offboarded users only have actions applicable to them: reactivating / making active
                  <DropdownMenuItem
                    onClick={onReactivate}
                    className="font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
                    Make Active
                  </DropdownMenuItem>
                ) : (
                  <>
                    {/* Resend invite: only for non-active, non-separated, pre-onboarding users */}
                    {canShowResendInvite && (
                      <>
                        <DropdownMenuItem
                          onClick={onResendInvite}
                          disabled={isResendingInvite}
                            className="font-medium text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Invite Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* HR Admin reassignment: only for super admins and eligible active staff */}
                      {isSuperAdmin && !employee.isSuperAdmin && isEligibleForHr && (
                        <>
                          <DropdownMenuItem
                            onClick={onReassignHrAdmin}
                            className="font-medium text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            {employee.isHrAdmin ? 'Remove HR Admin' : 'Assign HR Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Reinstate for suspended staff */}
                      {isSuspended && (
                        <DropdownMenuItem
                          onClick={onReactivate}
                          className="font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
                          Reinstate Employee (Make Active)
                        </DropdownMenuItem>
                      )}

                      {/* Make active from probation */}
                      {isProbation && (
                        <DropdownMenuItem
                          onClick={onReactivate}
                          className="font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 mr-2 text-emerald-600" />
                          Confirm Employment (Make Active)
                        </DropdownMenuItem>
                      )}

                      {/* Promotion for active employees */}
                      {isActive && (
                        <DropdownMenuItem onClick={onPromote} className="cursor-pointer">
                          <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />
                          Promote Employee
                        </DropdownMenuItem>
                      )}

                      {/* Probation decision / assignment for active or probation employees */}
                      {(isActive || isProbation) && (
                        <DropdownMenuItem onClick={onProbation} className="cursor-pointer">
                          <Clock className="w-4 h-4 mr-2 text-slate-500" />
                          {isProbation ? 'Update Probation' : 'Place on Probation'}
                        </DropdownMenuItem>
                      )}

                      {/* Suspension for active or probation staff */}
                      {!isSuspended && !isPreOnboarding && (
                        <DropdownMenuItem
                          onClick={onSuspend}
                          className="text-amber-600 focus:text-amber-700 focus:bg-amber-50 cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                          Suspend Employee
                        </DropdownMenuItem>
                      )}

                      {/* Offboard: available for non-offboarded staff */}
                      <DropdownMenuItem
                        onClick={onOffboard}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                      >
                        <UserX className="w-4 h-4 mr-2 text-red-500" />
                        Offboard Employee
                      </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
