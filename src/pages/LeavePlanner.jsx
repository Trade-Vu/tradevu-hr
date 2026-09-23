import React, { useState, useMemo } from "react";
import LeaveHeatmapCalendar from "@/components/Leave/LeaveHeatmapCalendar";
import LeavePlanDetailsSheet from "@/components/Leave/LeavePlanDetailsSheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "@/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getNormalizedRole, isManager as isManagerRole } from "@/lib/roleUtils";

export default function LeavePlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const role = getNormalizedRole(user);
  const isAdminOrManager = role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || isManagerRole(user);
  // SUPER_ADMIN can see the team plans for visibility, but leave plan review is an HR/manager action.
  const canReviewPlans = isAdminOrManager && role !== 'SUPER_ADMIN';
  const [capacityConflict, setCapacityConflict] = useState(null); // { planId, conflicts }
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: teamPlans, isLoading } = useQuery({
    queryKey: ['leave-plans-team', currentYear, null],
    queryFn: async () => {
      const res = await leaveApi.getTeamLeavePlans(currentYear);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: isAdminOrManager,
  });

  const activeSelectedPlan = useMemo(() => {
    if (!selectedPlan) return null;
    return teamPlans?.find(p => (p._id || p.id) === (selectedPlan._id || selectedPlan.id)) || selectedPlan;
  }, [teamPlans, selectedPlan]);

  const invalidatePlanQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-plans-team'] });
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const reviewMutation = useMutation({
    mutationFn: ({ planId, action, override }) => leaveApi.reviewLeavePlan(planId, { action, override }),
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approved' ? "Leave plan approved." : "Leave plan rejected.");
      invalidatePlanQueries();
      setCapacityConflict(null);
    },
    onError: (err, variables) => {
      // apiClient's error interceptor flattens the axios error into a plain Error; the original
      // response (needed here since a 409 carries a structured {text, conflicts} payload, not a string) survives on `.raw`.
      const payload = err?.raw?.response?.data?.message;
      if (err?.status === 409 && variables.action === 'approved' && payload && typeof payload === 'object' && Array.isArray(payload.conflicts)) {
        setCapacityConflict({ planId: variables.planId, ...payload });
        return;
      }
      toast.error(payload?.text || err?.message || "Failed to update leave plan");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-medium">Annual Leave Planner</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Map out your planned leave for the entire year. Managers can view aggregated plans.
          </p>
        </div>
      </div>

      <LeaveHeatmapCalendar />

      {isAdminOrManager && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Team Leave Plans Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading team plans...</p>
            ) : teamPlans?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team leave plans found for {currentYear}.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Planned Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPlans?.map((plan) => (
                    <TableRow
                      key={plan._id || plan.id}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-semibold text-indigo-700 shrink-0">
                            {plan.employeeId?.fullName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 leading-tight">
                              {plan.employeeId?.fullName || 'Employee'}
                            </div>
                            {plan.employeeId?.jobTitle && (
                              <div className="text-xs text-slate-500 font-normal mt-0.5">
                                {plan.employeeId.jobTitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-slate-800">
                          {(plan.plannedDates || []).length} days planned
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          plan.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          plan.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {plan.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-slate-600 hover:text-slate-900"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                          {canReviewPlans && plan.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => reviewMutation.mutate({ planId: plan._id || plan.id, action: 'rejected' })}
                                disabled={reviewMutation.isPending}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => reviewMutation.mutate({ planId: plan._id || plan.id, action: 'approved' })}
                                disabled={reviewMutation.isPending}
                              >
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <LeavePlanDetailsSheet
        plan={activeSelectedPlan}
        isOpen={Boolean(activeSelectedPlan)}
        onClose={() => setSelectedPlan(null)}
        canReview={canReviewPlans}
        onApprove={(planId) => reviewMutation.mutate({ planId, action: 'approved' })}
        onReject={(planId) => reviewMutation.mutate({ planId, action: 'rejected' })}
        isReviewing={reviewMutation.isPending}
      />

      <AlertDialog open={Boolean(capacityConflict)} onOpenChange={(open) => !open && setCapacityConflict(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This plan exceeds department leave capacity</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{capacityConflict?.text || "Approving this plan would put too many people off on the same day."}</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {(capacityConflict?.conflicts || []).map((c) => (
                    <li key={c.date}>{c.date}: {c.count} people would be off</li>
                  ))}
                </ul>
                <p>You can approve anyway, or reject/ask the employee to adjust their plan.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewMutation.mutate({ planId: capacityConflict.planId, action: 'approved', override: true })}
            >
              Approve Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
