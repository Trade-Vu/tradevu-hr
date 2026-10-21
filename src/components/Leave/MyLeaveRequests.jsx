import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, LayoutGrid, List, Paperclip, Plane } from 'lucide-react';
import { formatLeaveStatus, getLeaveStatusBadgeClass, isPendingLeaveStatus } from '@/lib/leaveStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const getLeaveTypeName = (request) => {
  const leaveType = request.leave_type || request.leaveTypeId?.name || 'Leave';
  return (typeof leaveType === 'string' ? leaveType : leaveType.name || 'Leave').replace(/_/g, ' ');
};

const getRequestDates = (request, safeDate) => {
  if (request.selectedDates?.length > 0) {
    return request.selectedDates.map((date) => format(safeDate(date), 'MMM d, yyyy')).join(', ');
  }
  return `${format(safeDate(request.start_date || request.startDate), 'MMM d, yyyy')} – ${format(
    safeDate(request.end_date || request.endDate),
    'MMM d, yyyy'
  )}`;
};

function CancelRequestButton({ request, onCancel }) {
  if (!isPendingLeaveStatus(request.status)) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this leave request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onCancel(request)}
            className="text-white bg-red-600 hover:bg-red-700"
          >
            Yes, cancel request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RequestDetails({ request, safeDate }) {
  const reliefStatus = (request.relief_officer_status || request.reliefOfficerStatus || 'PENDING').toUpperCase();
  const reliefOfficerName =
    request.relief_officer_name ||
    request.reliefOfficerId?.fullName ||
    request.reliefOfficerId?.name;
  const handoverNote = request.handover_note || request.handoverNote;
  const handoverNoteUrl = request.handover_note_url || request.handoverNoteUrl;
  const attachmentUrl = request.attachment_url || request.attachmentUrl;
  const approvers = request.approvers || request.approvalHistory || [];

  return (
    <div className="px-6 py-5 space-y-6">
      <section className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Dates</p>
          <p className="mt-1 text-sm">{getRequestDates(request, safeDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Duration</p>
          <p className="mt-1 text-sm">
            {request.total_days ?? request.totalDays ?? 0} day(s)
            {(request.isHalfDay) && <span className="ml-1 text-muted-foreground">· Half day</span>}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <Badge variant="outline" className={`mt-1 ${getLeaveStatusBadgeClass(request.status)}`}>
            {formatLeaveStatus(request.status)}
          </Badge>
        </div>
        {request.isAnnualPlan && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Request type</p>
            <Badge variant="outline" className="mt-1 text-indigo-700 border-indigo-200 bg-indigo-50">
              Annual Plan
            </Badge>
          </div>
        )}
        {request.isPastLeave && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Request type</p>
            <Badge variant="outline" className="mt-1 border-amber-200 bg-amber-50 text-amber-700">
              Past Leave
            </Badge>
          </div>
        )}
      </section>

      <section className="pt-5 space-y-2 border-t">
        <h3 className="text-sm font-semibold">Reason</h3>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {request.reason || 'No reason provided.'}
        </p>
      </section>

      {reliefOfficerName && (
        <section className="pt-5 space-y-2 border-t">
          <h3 className="text-sm font-semibold">Relief officer</h3>
          <p className="text-sm text-muted-foreground">{reliefOfficerName}</p>
          <Badge
            variant="outline"
            className={
              reliefStatus === 'CONFIRMED'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : reliefStatus === 'REJECTED'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
            }
          >
            {reliefStatus === 'CONFIRMED'
              ? 'Handover confirmed'
              : reliefStatus === 'REJECTED'
                ? 'Handover declined'
                : 'Awaiting confirmation'}
          </Badge>
        </section>
      )}

      {handoverNote && (
        <section className="pt-5 space-y-2 border-t">
          <h3 className="text-sm font-semibold">Handover note</h3>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{handoverNote}</p>
        </section>
      )}

      {(handoverNoteUrl || attachmentUrl) && (
        <section className="pt-5 space-y-3 border-t">
          <h3 className="text-sm font-semibold">Documents</h3>
          {handoverNoteUrl && (
            <a
              href={handoverNoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
            >
              <FileText className="w-4 h-4" /> View handover document
            </a>
          )}
          {attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Paperclip className="w-4 h-4" /> View supporting document
            </a>
          )}
        </section>
      )}

      {approvers.length > 0 && (
        <section className="pt-5 space-y-3 border-t">
          <h3 className="text-sm font-semibold">Approvals</h3>
          <div className="space-y-2">
            {approvers.map((approver, index) => (
              <div key={approver.id || approver._id || index} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {approver.actorName || approver.name || 'Unknown'}
                </span>
                <Badge variant="outline" className={getLeaveStatusBadgeClass(approver.newStatus || approver.action)}>
                  {formatLeaveStatus(approver.newStatus || approver.action)}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RequestCard({ request, onCancel, onViewMore, safeDate }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold capitalize text-slate-900">{getLeaveTypeName(request)}</h3>
          <Badge variant="outline" className={getLeaveStatusBadgeClass(request.status)}>
            {formatLeaveStatus(request.status)}
          </Badge>
          {request.isAnnualPlan && <Badge variant="outline">Annual Plan</Badge>}
          {request.isPastLeave && <Badge variant="outline">Past Leave</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{getRequestDates(request, safeDate)}</span>
          <span>
            {request.total_days ?? request.totalDays ?? 0} day(s)
            {request.isHalfDay && ' · Half day'}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={onViewMore}>
          View more
        </Button>
        <CancelRequestButton request={request} onCancel={onCancel} />
      </div>
    </div>
  );
}

export default function MyLeaveRequests({ requests = [], onCancel, safeDate = (date) => new Date(date) }) {
  const [view, setView] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches ? 'cards' : 'table'
  );
  const [selectedRequest, setSelectedRequest] = useState(null);

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-200">
        <CardTitle>My Leave Requests</CardTitle>
        {requests.length > 0 && (
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
      </CardHeader>
      <CardContent className="p-0">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
              <Plane className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No leave requests yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your submitted requests and their approval status will appear here.
            </p>
          </div>
        ) : view === 'table' ? (
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Leave type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id || request._id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize">{getLeaveTypeName(request)}</span>
                      {request.isAnnualPlan && <Badge variant="outline" className="text-[10px]">Annual Plan</Badge>}
                      {request.isPastLeave && <Badge variant="outline" className="text-[10px]">Past Leave</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-48 text-muted-foreground">
                    {getRequestDates(request, safeDate)}
                  </TableCell>
                  <TableCell>
                    {request.total_days ?? request.totalDays ?? 0}
                    {request.isHalfDay && <span className="ml-1 text-xs text-muted-foreground">Half day</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getLeaveStatusBadgeClass(request.status)}>
                      {formatLeaveStatus(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                        View more
                      </Button>
                      <CancelRequestButton request={request} onCancel={onCancel} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 space-y-3">
            {requests.map((request) => (
              <RequestCard
                key={request.id || request._id}
                request={request}
                onCancel={onCancel}
                onViewMore={() => setSelectedRequest(request)}
                safeDate={safeDate}
              />
            ))}
          </div>
        )}
      </CardContent>

      <Sheet open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <SheetContent className="flex flex-col w-full gap-0 p-0 overflow-y-auto sm:max-w-lg">
          {selectedRequest && (
            <>
              <SheetHeader className="px-6 py-5 pr-12 text-left border-b">
                <SheetTitle className="capitalize">{getLeaveTypeName(selectedRequest)}</SheetTitle>
                <SheetDescription>Leave request details</SheetDescription>
              </SheetHeader>
              <RequestDetails request={selectedRequest} safeDate={safeDate} />
              {isPendingLeaveStatus(selectedRequest.status) && (
                <div className="p-5 mt-auto border-t">
                  <CancelRequestButton request={selectedRequest} onCancel={onCancel} />
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
