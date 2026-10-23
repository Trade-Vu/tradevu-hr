import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Plane, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isPendingLeaveStatus, normalizeLeaveStatus } from '@/lib/leaveStatus';
import LeaveApprovalCard from './LeaveApprovalCard';
import LeaveRequestDetailDrawer from './LeaveRequestDetailDrawer';
import LeaveRequestTableRow from './LeaveRequestTableRow';

const getEmployeeName = (leave) =>
  leave.employee_name || leave.employeeId?.fullName || leave.employeeId?.name || 'Employee';

const getLeaveTypeName = (leave) =>
  (leave.leave_type || leave.leaveTypeId?.name || 'Annual Leave').replace(/_/g, ' ');

const getRequestDates = (leave, safeDate) =>
  leave.selectedDates?.length > 0
    ? leave.selectedDates.map((date) => format(safeDate(date), 'MMM d, yyyy')).join(', ')
    : `${format(safeDate(leave.start_date || leave.startDate), 'MMM d, yyyy')} – ${format(safeDate(leave.end_date || leave.endDate), 'MMM d, yyyy')}`;

const hasManagerApproved = (leave) =>
  Boolean(
    (leave.approvers || leave.approvalHistory || []).some(
      (h) => (h.action === 'approved' || h.action === 'APPROVED') && (h.role === 'MANAGER' || h.level === 0)
    ) || ((leave.currentApprovalLevel || 0) > 0 && leave.approvalLevels?.[0]?.role === 'MANAGER')
  );

export const RequestsSkeleton = () => (
  <div className="space-y-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
          <div className="space-y-1.5">
            <div className="w-28 h-3.5 rounded bg-slate-100" />
            <div className="w-20 h-2.5 rounded bg-slate-100" />
          </div>
        </div>
        <div className="w-20 h-6 rounded-full bg-slate-100" />
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
  canTakeAction = () => true,
  itemVariants,
}) {
  const [view, setView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'cards' : 'table'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((leave) => {
      const normalizedStatus = normalizeLeaveStatus(leave.status);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' ? isPendingLeaveStatus(leave.status) : normalizedStatus === statusFilter);
      const matchesSearch = !term || [
        getEmployeeName(leave),
        leave.employee_email,
        getLeaveTypeName(leave),
        leave.department_name,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  return (
    <motion.div variants={itemVariants}>
      <div className="overflow-hidden bg-white border shadow-xs rounded-2xl border-slate-200/80">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">All Leave Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, approve, or track historical leave submissions across your organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalRequests > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50/80 text-indigo-700 border border-indigo-100/70">
                {totalRequests} Total
              </span>
            )}
            {!isLoading && requests.length > 0 && (
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) => value && setView(value)}
                aria-label="Choose leave request view"
                className="shrink-0"
              >
                <ToggleGroupItem value="table" aria-label="Table view" title="Table view" className="h-8 px-2.5">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="cards" aria-label="Card view" title="Card view" className="h-8 px-2.5">
                  <LayoutGrid className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <RequestsSkeleton />
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex items-center justify-center w-14 h-14 mb-3 border bg-slate-50 border-slate-100 rounded-2xl">
                <Plane className="w-7 h-7 text-slate-300" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-slate-900">No leave requests</h3>
              <p className="max-w-sm text-xs text-slate-500">
                Employee time off requests will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search this page"
                    aria-label="Search leave requests on this page"
                    className="pl-9 h-9 rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                    {filteredRequests.length} of {requests.length} on this page
                  </p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-9 rounded-lg" aria-label="Filter requests by status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center">
                  <p className="font-medium text-slate-900 text-sm">No matching requests</p>
                  <p className="mt-1 text-xs text-slate-500">Try another employee name or status filter.</p>
                </div>
              ) : view === 'table' ? (
                <div className="overflow-x-auto">
                  <Table className="w-full table-fixed min-w-[720px]">
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead className="w-[32%] text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">Employee</TableHead>
                        <TableHead className="w-[28%] text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">Leave type</TableHead>
                        {/* <TableHead className="w-[22%] text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">Dates</TableHead> */}
                        <TableHead className="w-[14%] text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">Days</TableHead>
                        <TableHead className="w-[14%] text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3">Status</TableHead>
                        <TableHead className="w-[12%] text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-3 pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((leave) => (
                        <LeaveRequestTableRow
                          key={leave.id || leave._id}
                          leave={leave}
                          onSelect={setSelectedRequest}
                          onRequestAction={onRequestAction}
                          canTakeAction={canTakeAction}
                          isManagerOnly={isManagerOnly}
                          hasManagerApproved={hasManagerApproved}
                          getRequestDates={getRequestDates}
                          safeDate={(date) => (date ? new Date(date) : new Date())}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredRequests.map((leave, index) => (
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
                        managerApproved={hasManagerApproved(leave) && isManagerOnly}
                        showStatusBadge={true}
                        canTakeAction={canTakeAction(leave)}
                        safeDate={(d) => (d ? new Date(d) : new Date())}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {!isLoading && requests.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-4 border-t border-slate-100 mt-4">
              <p className="text-xs font-medium text-slate-500 tabular-nums">
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
      </div>

      <LeaveRequestDetailDrawer
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onApprove={(req) => onRequestAction(req, 'approve')}
        onReject={(req) => onRequestAction(req, 'reject')}
        onEdit={onEdit}
        canTakeAction={selectedRequest ? canTakeAction(selectedRequest) : true}
        managerApproved={selectedRequest ? (hasManagerApproved(selectedRequest) && isManagerOnly) : false}
      />
    </motion.div>
  );
}
