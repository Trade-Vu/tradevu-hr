import React, { useMemo } from "react";
import { format, parseISO, isValid } from "date-fns";
import {
  Calendar, Clock, User, Mail, Briefcase, Building,
  CheckCircle2, XCircle, AlertCircle, Hash, CalendarDays,
  Layers, Check, X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const safeFormat = (dateStr, formatStr) => {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return isValid(d) ? format(d, formatStr) : dateStr;
  } catch {
    return dateStr;
  }
};

function getConsecutiveDateBlocks(dates = []) {
  if (!dates || dates.length === 0) return [];
  const sorted = [...dates].sort((a, b) => new Date(a) - new Date(b));
  const blocks = [];
  let currentBlock = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      currentBlock.push(sorted[i]);
    } else {
      blocks.push(currentBlock);
      currentBlock = [sorted[i]];
    }
  }
  blocks.push(currentBlock);

  return blocks.map(block => ({
    startDate: block[0],
    endDate: block[block.length - 1],
    days: block.length,
    dates: block,
  }));
}

function getMonthlyBreakdown(dates = []) {
  const months = {};
  dates.forEach(d => {
    const dateObj = new Date(d);
    if (!isNaN(dateObj.getTime())) {
      const monthKey = format(dateObj, 'MMMM yyyy');
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(d);
    }
  });
  return Object.entries(months).map(([month, days]) => ({
    month,
    count: days.length,
    days: days.sort((a, b) => new Date(a) - new Date(b)),
  }));
}

export default function LeavePlanDetailsSheet({
  plan,
  isOpen,
  onClose,
  canReview = false,
  onApprove,
  onReject,
  isReviewing = false
}) {
  if (!plan) return null;

  const employee = plan.employeeId || {};
  const fullName = employee.fullName || 'Employee';
  const email = employee.email;
  const jobTitle = employee.jobTitle;
  const departmentName = employee.departmentId?.name || (typeof employee.departmentId === 'string' ? employee.departmentId : null);
  const employeeCode = employee.employeeCode;
  const plannedDates = useMemo(() => plan.plannedDates || [], [plan.plannedDates]);

  const sortedDates = useMemo(() => {
    return [...plannedDates].sort((a, b) => new Date(a) - new Date(b));
  }, [plannedDates]);

  const dateBlocks = useMemo(() => {
    return getConsecutiveDateBlocks(plannedDates);
  }, [plannedDates]);

  const monthlyBreakdown = useMemo(() => {
    return getMonthlyBreakdown(plannedDates);
  }, [plannedDates]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="p-6 border-b border-slate-200/80 bg-slate-50/60 shrink-0 text-left">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <SheetTitle className="text-xl font-bold text-slate-900">
                Annual Leave Plan
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 mt-0.5">
                Year {plan.year} Planning & Requested Schedule
              </SheetDescription>
            </div>
            <div>
              {plan.status === 'APPROVED' && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </Badge>
              )}
              {plan.status === 'REJECTED' && (
                <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1 font-semibold text-xs">
                  <XCircle className="w-3.5 h-3.5" /> Rejected
                </Badge>
              )}
              {plan.status === 'PENDING' && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-semibold text-xs">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Details Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm shrink-0">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-900 text-base leading-tight truncate">
                  {fullName}
                </h4>
                {jobTitle && (
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {jobTitle}
                  </p>
                )}
              </div>
            </div>

            <Separator className="bg-slate-200/60" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
              {email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {departmentName && (
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{departmentName}</span>
                </div>
              )}
              {employeeCode && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>ID: {employeeCode}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-900">{plannedDates.length} Total Days</span>
              </div>
            </div>
          </div>

          {/* Review Info if already reviewed */}
          {plan.reviewedAt && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Reviewed Date:</span>
                <span>{safeFormat(plan.reviewedAt, 'PPP p')}</span>
              </div>
              {plan.reviewedBy && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Reviewed By:</span>
                  <span>{plan.reviewedBy.fullName || plan.reviewedBy.name || plan.reviewedBy.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Monthly Breakdown Badges */}
          {monthlyBreakdown.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Breakdown
              </h5>
              <div className="flex flex-wrap gap-2">
                {monthlyBreakdown.map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-700"
                  >
                    <span>{m.month}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold">
                      {m.count} {m.count === 1 ? 'day' : 'days'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days breakdown tabs */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Planned Annual Leave Dates
            </h5>

            <Tabs defaultValue="blocks" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="blocks" className="text-xs font-medium rounded-lg">
                  <Layers className="w-3.5 h-3.5 mr-1.5" />
                  Leave Periods ({dateBlocks.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs font-medium rounded-lg">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  All Days ({plannedDates.length})
                </TabsTrigger>
              </TabsList>

              {/* Leave periods (consecutive blocks) */}
              <TabsContent value="blocks" className="space-y-2.5 mt-0">
                {dateBlocks.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No dates planned yet.</p>
                ) : (
                  dateBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-semibold text-xs border border-indigo-100">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {block.startDate === block.endDate
                              ? safeFormat(block.startDate, 'EEEE, MMM d, yyyy')
                              : `${safeFormat(block.startDate, 'MMM d')} – ${safeFormat(block.endDate, 'MMM d, yyyy')}`}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {block.startDate === block.endDate
                              ? 'Single day leave'
                              : `${safeFormat(block.startDate, 'EEEE')} to ${safeFormat(block.endDate, 'EEEE')}`}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 px-2 py-0.5 text-xs font-semibold shrink-0">
                        {block.days} {block.days === 1 ? 'day' : 'days'}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* All individual selected days */}
              <TabsContent value="all" className="mt-0">
                {sortedDates.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No dates planned yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortedDates.map((dateStr, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs text-slate-800"
                      >
                        <span className="font-medium text-slate-900">
                          {safeFormat(dateStr, 'EEE, MMM d, yyyy')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer Actions if plan is pending review */}
        {canReview && plan.status === 'PENDING' && (
          <SheetFooter className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 sm:justify-between flex-row items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Reviewing plan for {fullName}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                onClick={() => onReject(plan._id || plan.id)}
                disabled={isReviewing}
              >
                <X className="w-4 h-4" />
                Reject Plan
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={() => onApprove(plan._id || plan.id)}
                disabled={isReviewing}
              >
                <Check className="w-4 h-4" />
                Approve Plan
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
