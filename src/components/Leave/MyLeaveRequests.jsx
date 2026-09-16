import React from 'react';
import { Calendar, Paperclip, Plane } from 'lucide-react';
import { format } from 'date-fns';
import { toTitleCase } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function MyLeaveRequests({ requests, statusColors, onCancel, safeDate }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <CardTitle>My Leave Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {requests.length === 0 ? (
          <div className="py-12 text-center">
            <Plane className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No leave requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-slate-900">
                          {request.leave_type.replace("_", " ").toUpperCase()}
                        </h4>
                        <Badge variant="outline" className={statusColors[request.status] || ""}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {request.selectedDates?.length > 0
                            ? request.selectedDates
                                .map((date) => format(safeDate(date), "MMM d"))
                                .join(", ")
                            : `${format(safeDate(request.start_date), "MMM d, yyyy")} - ${format(safeDate(request.end_date), "MMM d, yyyy")}`}
                        </p>
                        <p>
                          <strong>Days:</strong> {request.total_days}{" "}
                          {request.isHalfDay && (
                            <Badge variant="secondary" className="ml-1 text-[10px]">
                              Half Day
                            </Badge>
                          )}
                        </p>
                        <p>
                          <strong>Reason:</strong> {request.reason}
                        </p>
                        {request.attachment_url && (
                          <p className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-500" />
                            <a
                              href={request.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          </p>
                        )}
                        {request.approvers?.length > 0 && (
                          <div className="pt-3 mt-3 border-t border-slate-100">
                            <p className="mb-2 font-medium text-slate-700">Approvals:</p>
                            {request.approvers.map((approver, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span>{approver.actorName || approver.name || 'Unknown'}</span>
                                <Badge
                                  variant="outline"
                                  className={`${statusColors[approver.newStatus] || ""} text-xs`}
                                >
                                  {toTitleCase(approver.newStatus || approver.action)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {["PENDING", "PENDING_APPROVAL", "PENDING_HR", "APPROVED"].includes(
                      request.status,
                    ) && (
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
                              Are you sure you want to cancel this leave request? This action cannot
                              be undone.
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
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
