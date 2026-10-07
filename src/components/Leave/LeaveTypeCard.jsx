import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, FileText, Briefcase, Layers, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatApprovalChain } from '@/lib/approvalSteps';
import { toTitleCase } from '@/lib/utils';

export default function LeaveTypeCard({
  leaveType,
  defaultChainLabel,
  canDelete,
  isDeleting,
  onEdit,
  onDelete,
}) {
  const lt = leaveType;
  const hasNotice = Boolean(lt.hasNoticePeriod || (lt.noticePeriodDays > 0) || (lt.noticeDaysRequired > 0));
  const noticeDays = lt.noticePeriodDays || lt.noticeDaysRequired || 0;
  const isHandover = Boolean(lt.requiresHandover || lt.handoverRequirement === 'COMPULSORY');
  const isReliefOfficerRequired = lt.requiresReliefOfficer !== false;
  const defaultDays = lt.defaultDays ?? lt.daysPerYear ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="h-full flex flex-col justify-between border-slate-200/90 hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
          {/* Header: Title, Code, Paid status, Actions */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-lg leading-tight">{lt.name}</h4>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {lt.code && (
                    <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {lt.code.toUpperCase()}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-medium border ${
                      lt.isPaid
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {lt.isPaid ? 'Paid Leave' : 'Unpaid'}
                  </Badge>
                  {lt.onlyConfirmed && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium border bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Confirmed Only
                    </Badge>
                  )}
                  {Array.isArray(lt.applicableGenders) && lt.applicableGenders.length === 1 && (
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium border ${
                        lt.applicableGenders[0] === 'FEMALE'
                          ? 'bg-pink-50 text-pink-700 border-pink-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {lt.applicableGenders[0] === 'FEMALE' ? 'Female Only' : 'Male Only'}
                    </Badge>
                  )}
                  {Array.isArray(lt.employmentTypes) && lt.employmentTypes.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200"
                    >
                      {lt.employmentTypes.length} Types
                    </Badge>
                  )}
                  {Array.isArray(lt.employeeClasses) && lt.employeeClasses.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium border bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {lt.employeeClasses.length} Classes
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(lt)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(lt)}
                    disabled={isDeleting}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Quota & Rules Row */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{defaultDays}</span>
                <span className="text-xs text-slate-500 font-medium">days / year</span>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-end">
                {hasNotice && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    <Calendar className="w-3 h-3" />
                    {noticeDays}d notice
                  </span>
                )}
                {isHandover && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <FileText className="w-3 h-3" />
                    Handover req.
                  </span>
                )}
                {isReliefOfficerRequired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                    <UserCheck className="w-3 h-3" />
                    Relief req.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <UserX className="w-3 h-3" />
                    No relief
                  </span>
                )}
              </div>
            </div>

            {/* Approval Chain */}
            <div className="mt-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Approval: </span>
              {lt.requiresApproval === false ? (
                <span className="text-emerald-600 font-medium">Auto-approved</span>
              ) : lt.approvalSteps?.length ? (
                formatApprovalChain(lt.approvalSteps)
              ) : (
                `Default (${defaultChainLabel})`
              )}
            </div>
          </div>

          {/* Quota & Exceptions Section Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Baseline Quota:</span>
              <span className="font-bold text-slate-900">{lt.defaultDays ?? lt.daysPerYear ?? 0} days / yr</span>
            </div>

            {Array.isArray(lt.daysExceptions) && lt.daysExceptions.length > 0 ? (
              <div className="space-y-1 pt-1.5 border-t border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-500 block">Exceptions:</span>
                <div className="flex flex-wrap gap-1">
                  {lt.daysExceptions.map((ex, i) => {
                    const label =
                      ex.subjectName ||
                      (ex.employmentType && ex.employmentType !== 'ALL'
                        ? `${toTitleCase(ex.employmentType)}${ex.subjectId && ex.subjectId !== 'ALL' ? ` (${toTitleCase(ex.subjectId)})` : ''}`
                        : toTitleCase(ex.subjectId || ex.category || 'Exception'));
                    return (
                      <Badge
                        key={i}
                        variant="outline"
                        className="px-2 py-0.5 text-[10px] font-medium bg-blue-50/80 text-blue-700 border-blue-200"
                      >
                        {label}: {ex.days}d
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px] block">
                Standard quota applies to all employees
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
