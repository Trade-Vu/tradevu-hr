import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  FileText,
  CalendarRange,
  Loader2,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ApprovalsSkeleton, EmptyState, safeDate } from './ApprovalsUIComponents';

function getLeaveApprovalStageInfo(leave) {
  const levels = Array.isArray(leave.approvalLevels) ? leave.approvalLevels : [];
  const currentLevelIdx = leave.currentApprovalLevel || 0;

  if (!levels.length) {
    return {
      label: 'Awaiting Approval',
      role: 'ADMIN',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: Clock,
      stepNumber: 1,
      totalSteps: 1,
    };
  }

  const currentStep = levels[currentLevelIdx] || levels[levels.length - 1];
  const role = currentStep?.role?.toUpperCase();
  const stepNumber = Math.min(currentLevelIdx + 1, levels.length);
  const totalSteps = levels.length;

  if (role === 'MANAGER') {
    return {
      label: totalSteps > 1 ? `Stage ${stepNumber}/${totalSteps}: Waiting on Manager` : 'Waiting on Manager',
      role: 'MANAGER',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: Clock,
      stepNumber,
      totalSteps,
    };
  }

  if (role === 'HR_ADMIN' || role === 'HR') {
    return {
      label: totalSteps > 1 ? `Stage ${stepNumber}/${totalSteps}: Waiting on HR Admin` : 'Waiting on HR Admin',
      role: 'HR_ADMIN',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
      icon: UserCheck,
      stepNumber,
      totalSteps,
    };
  }

  if (role === 'FINANCE_ADMIN' || role === 'FINANCE') {
    return {
      label: totalSteps > 1 ? `Stage ${stepNumber}/${totalSteps}: Waiting on Finance` : 'Waiting on Finance',
      role: 'FINANCE_ADMIN',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: UserCheck,
      stepNumber,
      totalSteps,
    };
  }

  return {
    label: totalSteps > 1 ? `Stage ${stepNumber}/${totalSteps}: Waiting on ${role}` : `Waiting on ${role}`,
    role,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    icon: Clock,
    stepNumber,
    totalSteps,
  };
}

export default function LeaveApprovalsTab({
  loading,
  pendingLeaves,
  getEmployeeName,
  onLeaveAction,
  isApprovingLeave,
  leaveAppVars,
}) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || Boolean(user?.isOrgOwner);
  const isHrAdmin = user?.role === 'HR_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const currentEmployeeId = user?.employeeId?._id || user?.employeeId?.id || user?.employeeId;

  if (loading) {
    return <ApprovalsSkeleton />;
  }

  if (pendingLeaves.length === 0) {
    return <EmptyState message="No pending leave requests." icon={CalendarRange} />;
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {pendingLeaves.map((leave) => {
          const stageInfo = getLeaveApprovalStageInfo(leave);
          const StageIcon = stageInfo.icon;
          const previousApproval = (leave.approvalHistory || [])
            .slice()
            .reverse()
            .find((h) => h.action === 'approved' || h.action === 'APPROVED');

          const hasManagerApproved = Boolean(
            (leave.approvalHistory || leave.approvers || []).some(
              (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
            ) ||
            ((leave.currentApprovalLevel || 0) > 0 && Array.isArray(leave.approvalLevels) && leave.approvalLevels[0]?.role === 'MANAGER')
          );

          // Authorization determination
          let canApprove = true;
          let disabledReason = null;

          if (!isSuperAdmin) {
            if (stageInfo.role === 'MANAGER') {
              if (isManager) {
                if (currentEmployeeId) {
                  const isAuthorized =
                    (leave.employee?.managerId && leave.employee.managerId.toString() === currentEmployeeId.toString()) ||
                    (leave.employee?.departmentManagerId && leave.employee.departmentManagerId.toString() === currentEmployeeId.toString());
                  if (!isAuthorized) {
                    canApprove = false;
                    disabledReason = 'Only direct managers or department heads can approve this stage';
                  }
                }
              } else if (isHrAdmin) {
                canApprove = false;
                disabledReason = 'Requires direct manager approval first';
              }
            } else if (stageInfo.role === 'HR_ADMIN') {
              if (isManager) {
                canApprove = false;
                disabledReason = 'Awaiting final HR Admin review';
              }
            }
          }

          return (
            <motion.div
              key={leave.id}
              whileHover={{ y: -2 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-200/60 rounded-xl bg-white shadow-sm hover:shadow-md transition-all gap-4 group"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {getEmployeeName(leave.employeeId)}
                  </h4>

                  {leave.leaveTypeName && (
                    <Badge variant="outline" className="bg-indigo-50/60 border-indigo-200 text-indigo-700 text-[10px] font-medium py-0 h-5">
                      {leave.leaveTypeName}
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 text-[11px] font-medium py-0.5 px-2.5 rounded-full border ${stageInfo.badgeClass}`}
                  >
                    <StageIcon className="w-3 h-3 shrink-0" />
                    <span>{stageInfo.label}</span>
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-medium py-0 h-5 text-[10px]">
                    {leave.totalDays} {leave.totalDays === 1 ? 'Day' : 'Days'}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {safeDate(leave.startDate)} <span className="text-slate-300 mx-1">→</span> {safeDate(leave.endDate)}
                  </span>
                </div>

                {previousApproval && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Passed Stage 1: Approved by {previousApproval.actorName || previousApproval.role || 'Manager'}
                    </span>
                  </div>
                )}

                {leave.reason && (
                  <p className="text-sm text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{leave.reason}"
                  </p>
                )}

                {leave.attachmentUrl && (
                  <div className="mt-2">
                    <a
                      href={leave.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> View Attachment
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hasManagerApproved && isManager && !isSuperAdmin && !isHrAdmin ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Approved by Manager</span>
                    <span className="text-emerald-500 font-normal">• Awaiting HR Review</span>
                  </div>
                ) : canApprove ? (
                  <>
                    <Button
                      variant="outline"
                      className="text-slate-600 border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
                      onClick={() => onLeaveAction({ leave, action: 'reject' })}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 rounded-lg shadow-sm"
                      onClick={() => onLeaveAction({ leave, action: 'approve' })}
                      disabled={isApprovingLeave && leaveAppVars?.id === leave.id}
                    >
                      {isApprovingLeave && leaveAppVars?.id === leave.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                  </>
                ) : disabledReason ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block cursor-not-allowed">
                        <Button
                          disabled
                          className="bg-indigo-600/60 text-white flex items-center gap-2 rounded-lg shadow-sm cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{disabledReason}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
