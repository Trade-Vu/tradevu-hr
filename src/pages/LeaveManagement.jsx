import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin as checkIsAdmin, isManager as checkIsManager } from "@/lib/roleUtils";
import { useQuery } from "@tanstack/react-query";
import { approvalsApi } from "@/api";
import LeaveOverview from "./LeaveOverview";
import AllLeaveRequests from "./AllLeaveRequests";
import LeavePlanner from "./LeavePlanner";

export default function LeaveManagement() {
  const { user } = useAuth();
  const isAdmin = checkIsAdmin(user);
  const isManager = checkIsManager(user);
  const canViewTeamRequests = isAdmin || isManager;

  const { data: pendingData } = useQuery({
    queryKey: ['pendingApprovalsCount'],
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled: !!user?.organizationId && canViewTeamRequests,
    staleTime: 30000,
  });
  const pendingLeaveCount = pendingData?.pendingLeaveCount || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your leave requests, view balances, and plan your annual leave.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {canViewTeamRequests && (
            <TabsTrigger value="requests" className="flex items-center gap-1.5">
              <span>{isAdmin ? "Requests" : "Team Requests"}</span>
              {pendingLeaveCount > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {pendingLeaveCount}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="planner">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <LeaveOverview />
        </TabsContent>
        {canViewTeamRequests && (
          <TabsContent value="requests" className="space-y-4">
            <AllLeaveRequests />
          </TabsContent>
        )}
        <TabsContent value="planner" className="space-y-4">
          <LeavePlanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
