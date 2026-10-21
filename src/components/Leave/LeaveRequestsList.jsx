import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, LayoutGrid, List, Plane, Search, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatLeaveStatus, getLeaveStatusBadgeClass, isPendingLeaveStatus, normalizeLeaveStatus } from '@/lib/leaveStatus';
import LeaveApprovalCard from './LeaveApprovalCard';

const getEmployeeName = (leave) =>
  leave.employee_name || leave.employeeId?.fullName || leave.employeeId?.name || 'Employee';

const getLeaveTypeName = (leave) =>
  (leave.leave_type || leave.leaveTypeId?.name || 'Annual Leave').replace(/_/g, ' ');

const getRequestDates = (leave, safeDate) => {
  if (leave.selectedDates?.length > 0) {
    return leave.selectedDates.map((date) => format(safeDate(date), 'MMM d, yyyy')).join(', ');
  }
  return `${format(safeDate(leave.start_date || leave.startDate), 'MMM d, yyyy')} – ${format(
    safeDate(leave.end_date || leave.endDate),
    'MMM d, yyyy'
  )}`;
};

const hasManagerApproved = (leave) =>
  Boolean(
    (leave.approvers || leave.approvalHistory || []).some(
      (history) =>
        (history.action === 'approved' || history.action === 'APPROVED') &&
        (history.role === 'MANAGER' || history.level === 0)
    ) ||
      ((leave.currentApprovalLevel || 0) > 0 &&
        Array.isArray(leave.approvalLevels) &&
        leave.approvalLevels[0]?.role === 'MANAGER')
  );

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
  canTakeAction = () => true,
  itemVariants,
}) {
  const [view, setView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'cards' : 'table'
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      <div className="overflow-hidden bg-white border shadow-xs rounded-2xl border-slate-200/70">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">All Leave Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, approve, or track historical leave submissions across your organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalRequests > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
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
                <ToggleGroupItem value="table" aria-label="Table view" title="Table view">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="cards" aria-label="Card view" title="Card view">
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
              <h3 className="mb-1 text-base font-bold text-slate-900">No leave requests</h3>
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
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {filteredRequests.length} of {requests.length} on this page
                  </p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" aria-label="Filter requests by status">
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
                <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                  <p className="font-medium">No matching requests</p>
                  <p className="mt-1 text-sm text-muted-foreground">Try another name or status filter.</p>
                </div>
              ) : view === 'table' ? (
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Employee</TableHead>
                  <TableHead className="w-[21%]">Leave type</TableHead>
                  <TableHead className="w-[25%]">Dates</TableHead>
                  <TableHead className="w-[8%]">Days</TableHead>
                  <TableHead className="w-[26%]">Status &amp; actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((leave) => {
                  const actionable = canTakeAction(leave);
                  const isPending = isPendingLeaveStatus(leave.status);
                  const managerHasApproved = hasManagerApproved(leave) && isManagerOnly;
                  const days = leave.total_days ?? leave.totalDays ?? 0;

                  return (
                    <TableRow key={leave.id || leave._id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{getEmployeeName(leave)}</div>
                        {(leave.department_name || leave.employeeId?.departmentId?.name || leave.employeeId?.department?.name) && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {leave.department_name || leave.employeeId?.departmentId?.name || leave.employeeId?.department?.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium capitalize">{getLeaveTypeName(leave)}</span>
                          {leave.isHalfDay && <Badge variant="secondary" className="text-[10px]">Half day</Badge>}
                          {leave.isAnnualPlan && <Badge variant="outline" className="text-[10px]">Annual plan</Badge>}
                          {leave.isPastLeave && <Badge variant="outline" className="text-[10px]">Past leave</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-start gap-1.5 whitespace-normal">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {getRequestDates(leave, (date) => (date ? new Date(date) : new Date()))}
                        </span>
                      </TableCell>
                      <TableCell>{days} {days === 1 ? 'day' : 'days'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={getLeaveStatusBadgeClass(leave.status)}>
                            {formatLeaveStatus(leave.status)}
                          </Badge>
                          {isPending && !actionable ? (
                            <span className="text-xs text-muted-foreground">
                              You submitted this request
                            </span>
                          ) : isPending && managerHasApproved ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              Approved by manager
                            </span>
                          ) : isPending ? (
                            <div className="flex gap-1.5">
                              {onEdit && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEdit(leave)}
                                >
                                  Edit
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-600 px-2 text-white hover:bg-emerald-700"
                                onClick={() => onRequestAction(leave, 'approve')}
                                aria-label={`Approve ${getEmployeeName(leave)}'s ${getLeaveTypeName(leave)} request`}
                                title="Approve request"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => onRequestAction(leave, 'reject')}
                                aria-label={`Reject ${getEmployeeName(leave)}'s ${getLeaveTypeName(leave)} request`}
                                title="Reject request"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-3.5">
              {filteredRequests.map((leave, index) => {
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
                      managerApproved={hasManagerApproved(leave) && isManagerOnly}
                      showStatusBadge={true}
                      canTakeAction={canTakeAction(leave)}
                      safeDate={(d) => (d ? new Date(d) : new Date())}
                    />
                  </motion.div>
                );
              })}

            </div>
              )}
            </>
          )}
          {!isLoading && requests.length > 0 && totalPages > 1 && (
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
      </div>
    </motion.div>
  );
}
