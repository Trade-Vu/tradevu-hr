import React from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Calendar, Paperclip, FileText, CheckCircle, XCircle, Edit } from "lucide-react";
import { isPendingLeaveStatus, formatLeaveStatus, getLeaveStatusBadgeClass } from "@/lib/leaveStatus";

export const RequestsSkeleton = () => (
  <div className="space-y-4">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="flex items-start justify-between p-5 bg-white border shadow-sm border-slate-100 rounded-2xl animate-pulse">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100"></div>
          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-slate-100"></div>
            <div className="w-24 h-3 rounded bg-slate-100"></div>
            <div className="w-48 h-3 mt-2 rounded bg-slate-100"></div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="w-20 h-6 rounded-full bg-slate-100"></div>
          <div className="flex gap-2 mt-2">
            <div className="w-20 h-8 rounded-md bg-slate-100"></div>
            <div className="w-20 h-8 rounded-md bg-slate-100"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function LeaveRequestsList({
  requests = [],
  isLoading = false,
  isManagerOnly = false,
  page = 1,
  limit = 10,
  totalRequests = 0,
  totalPages = 1,
  onPageChange,
  onEdit,
  onRequestAction,
  itemVariants,
}) {
  return (
    <motion.div variants={itemVariants}>
      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200/60">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">All leave requests</h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <RequestsSkeleton />
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 mb-4 border bg-slate-50 border-slate-100 rounded-2xl">
                <Plane className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-900">No leave requests</h3>
              <p className="max-w-sm text-slate-500">When employees submit time off requests, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((leave, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={leave.id}
                  className="p-5 transition-all bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-md rounded-2xl group"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div className="flex items-start flex-1 gap-4">
                      <div className="flex items-center justify-center w-12 h-12 border border-indigo-100 rounded-full bg-indigo-50 shrink-0">
                        <span className="text-lg font-bold text-indigo-700">
                          {leave.employee_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{leave.employee_name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-slate-200 text-slate-600">
                            {leave.leave_type.replace('_', ' ')}
                          </Badge>
                          {leave.isAnnualPlan && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-indigo-200 text-indigo-700 bg-indigo-50">
                              Annual Plan
                            </Badge>
                          )}
                          {leave.isPastLeave && (
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold border-amber-200 text-amber-700 bg-amber-50">
                              Past Leave
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {leave.selectedDates && leave.selectedDates.length > 0 ? (
                            <span>{leave.selectedDates.map(d => format(new Date(d), 'MMM dd')).join(', ')}</span>
                          ) : (
                            <>
                              <span>{format(new Date(leave.start_date), 'MMM dd, yyyy')}</span>
                              <span className="text-slate-300">-</span>
                              <span>{format(new Date(leave.end_date), 'MMM dd, yyyy')}</span>
                            </>
                          )}
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-xs ml-1">
                            {leave.total_days} day{leave.total_days !== 1 ? 's' : ''} {leave.isHalfDay && <Badge variant="secondary" className="ml-1 text-[10px]">Half Day</Badge>}
                          </span>
                        </div>
                        <p className="p-3 text-sm border text-slate-600 bg-slate-50/80 rounded-xl border-slate-100">
                          "{leave.reason}"
                        </p>

                        {leave.relief_officer_name && (
                          <div className="flex items-center gap-2 flex-wrap py-1 text-xs">
                            <span className="font-semibold text-slate-700">Relief Officer: {leave.relief_officer_name}</span>
                            {leave.relief_officer_status === 'CONFIRMED' && (
                              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-semibold">
                                Handover Confirmed ✓
                              </Badge>
                            )}
                            {leave.relief_officer_status === 'REJECTED' && (
                              <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200 text-[10px] font-semibold">
                                Handover Declined ✗
                              </Badge>
                            )}
                            {(!leave.relief_officer_status || leave.relief_officer_status === 'PENDING') && (
                              <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px] font-semibold">
                                Awaiting Relief Confirmation ⏳
                              </Badge>
                            )}
                          </div>
                        )}

                        {leave.handover_note && (
                          <div className="mt-2.5 p-2.5 text-xs text-slate-700 bg-amber-50/70 border border-amber-200/60 rounded-lg">
                            <span className="font-semibold text-amber-900 block mb-0.5">Handover Note:</span>
                            {leave.handover_note}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-2.5">
                          {leave.attachment_url && (
                            <a
                              href={leave.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Paperclip className="w-3.5 h-3.5" /> View Attachment
                            </a>
                          )}
                          {leave.handover_note_url && (
                            <a
                              href={leave.handover_note_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Handover Document
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 pl-16 md:flex-col md:items-end md:justify-start md:pl-0">
                      <Badge className={`${getLeaveStatusBadgeClass(leave.status)} border font-semibold px-2.5 py-0.5 rounded-full shadow-sm`}>
                        {formatLeaveStatus(leave.status)}
                      </Badge>

                      {isPendingLeaveStatus(leave.status) && (() => {
                        const hasManagerApproved = Boolean(
                          (leave.approvers || leave.approvalHistory || []).some(
                            (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
                          ) ||
                          ((leave.currentApprovalLevel || 0) > 0 && Array.isArray(leave.approvalLevels) && leave.approvalLevels[0]?.role === 'MANAGER')
                        );

                        if (hasManagerApproved && isManagerOnly) {
                          return (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Approved by Manager</span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => onEdit(leave)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => onRequestAction(leave, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => onRequestAction(leave, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Reject
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="flex items-center justify-between px-2 mt-6">
                <p className="text-sm font-medium text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{((page - 1) * limit) + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * limit, totalRequests)}</span> of <span className="font-semibold text-slate-900">{totalRequests}</span> requests
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded-lg shadow-sm border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="rounded-lg shadow-sm border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
