import React from "react";
import LeaveHeatmapCalendar from "@/components/Leave/LeaveHeatmapCalendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LeavePlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const isAdminOrManager = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'MANAGER';

  const { data: teamPlans, isLoading } = useQuery({
    queryKey: ['teamLeavePlansApproval', currentYear],
    queryFn: async () => {
      const QUERY = gql`
        query GetTeamLeavePlans($year: Int!) {
          teamLeavePlans(year: $year) { 
            id 
            status 
            plannedDates 
            employee { fullName } 
          }
        }
      `;
      const data = await gqlClient.request(QUERY, { year: currentYear });
      return data.teamLeavePlans || [];
    },
    enabled: isAdminOrManager
  });

  const approveMutation = useMutation({
    mutationFn: async (planId) => {
      const MUTATION = gql`
        mutation ApproveLeavePlan($planId: ID!) {
          approveLeavePlan(planId: $planId) { id status }
        }
      `;
      return gqlClient.request(MUTATION, { planId });
    },
    onSuccess: () => {
      toast.success("Leave plan approved.");
      queryClient.invalidateQueries({ queryKey: ['teamLeavePlansApproval'] });
      queryClient.invalidateQueries({ queryKey: ['teamLeavePlans'] }); // Also invalidate calendar's cache
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (planId) => {
      const MUTATION = gql`
        mutation RejectLeavePlan($planId: ID!) {
          rejectLeavePlan(planId: $planId) { id status }
        }
      `;
      return gqlClient.request(MUTATION, { planId });
    },
    onSuccess: () => {
      toast.success("Leave plan rejected.");
      queryClient.invalidateQueries({ queryKey: ['teamLeavePlansApproval'] });
      queryClient.invalidateQueries({ queryKey: ['teamLeavePlans'] });
    }
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
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.employee.fullName}</TableCell>
                      <TableCell>{plan.plannedDates.length} days planned</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          plan.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          plan.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {plan.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => rejectMutation.mutate(plan.id)}
                              disabled={rejectMutation.isPending || approveMutation.isPending}
                            >
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveMutation.mutate(plan.id)}
                              disabled={rejectMutation.isPending || approveMutation.isPending}
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
