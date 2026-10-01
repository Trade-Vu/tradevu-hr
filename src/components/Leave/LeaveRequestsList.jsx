import React from 'react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeaveApprovalCard from './LeaveApprovalCard';

export const RequestsSkeleton = () => (
  <div className="space-y-4">
    {Array(4)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className="flex items-start justify-between p-5 bg-white border shadow-xs border-slate-100 rounded-xl animate-pulse"
        >
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
      <div className="overflow-hidden bg-white border shadow-xs rounded-2xl border-slate-200/70">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">All Leave Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, approve, or track historical leave submissions across your organization.
            </p>
          </div>
          {totalRequests > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {totalRequests} Total
            </span>
          )}
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <RequestsSkeleton />
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex items-center justify-center w-14 h-14 mb-3 border bg-slate-50 border-slate-100 rounded-2xl">
                <Plane className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="mb-1 text-base font-bold text-slate-900">No leave requests</h3>
              <p className="max-w-sm text-xs text-slate-500">
                When employees submit time off requests, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {requests.map((leave, index) => {
                const hasManagerApproved = Boolean(
                  (leave.approvers || leave.approvalHistory || []).some(
                    (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
                  ) ||
                  ((leave.currentApprovalLevel || 0) > 0 &&
                    Array.isArray(leave.approvalLevels) &&
                    leave.approvalLevels[0]?.role === 'MANAGER')
                );

                return (
                  <motion.div
                    key={leave.id || leave._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <LeaveApprovalCard
                      request={leave}
                      onApprove={() => onRequestAction(leave, 'approve')}
                      onReject={() => onRequestAction(leave, 'reject')}
                      onEdit={onEdit ? () => onEdit(leave) : undefined}
                      managerApproved={hasManagerApproved && isManagerOnly}
                      showStatusBadge={true}
                      safeDate={(d) => (d ? new Date(d) : new Date())}
                    />
                  </motion.div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-4 border-t border-slate-100 mt-4">
                  <p className="text-xs font-medium text-slate-500">
                    Showing <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(page * limit, totalRequests)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{totalRequests}</span> requests
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="h-8 rounded-lg shadow-2xs border-slate-200 text-xs hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98] transition-all duration-150"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages || totalPages === 0}
                      className="h-8 rounded-lg shadow-2xs border-slate-200 text-xs hover:bg-slate-50 hover:text-indigo-600 active:scale-[0.98] transition-all duration-150"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
