import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, FileText, Briefcase, Layers } from 'lucide-react';
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

          {/* Eligibility Section Footer */}
          <div className="pt-3 border-t border-slate-100 space-y-2 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl">
            {/* Employment Types */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 shrink-0 w-16">
                <Briefcase className="w-3 h-3 text-slate-400" />
                Types:
              </span>
              <div className="flex flex-wrap gap-1 items-center flex-1">
                {lt.employmentTypes && lt.employmentTypes.length > 0 ? (
                  lt.employmentTypes.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-normal bg-white text-slate-700 border border-slate-200"
                    >
                      {toTitleCase(t)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">All Employment Types</span>
                )}
              </div>
            </div>

            {/* Employee Classes */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 shrink-0 w-16">
                <Layers className="w-3 h-3 text-slate-400" />
                Classes:
              </span>
              <div className="flex flex-wrap gap-1 items-center flex-1">
                {lt.employeeClasses && lt.employeeClasses.length > 0 ? (
                  lt.employeeClasses.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-normal bg-white text-slate-700 border border-slate-200"
                    >
                      {toTitleCase(c)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">All Employee Categories</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
