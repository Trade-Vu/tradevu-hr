import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plane, Clock } from "lucide-react";
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto inline-flex border border-slate-200/70">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Plane className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          {canViewTeamRequests && (
            <TabsTrigger
              value="requests"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
            >
              <Clock className="w-4 h-4" />
              <span>{isAdmin ? "Requests" : "Team Requests"}</span>
              {pendingLeaveCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-bold data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                  {pendingLeaveCount}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger
            value="planner"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </TabsTrigger>
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
