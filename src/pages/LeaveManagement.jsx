import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import LeaveOverview from "./LeaveOverview";
import AllLeaveRequests from "./AllLeaveRequests";
import LeavePlanner from "./LeavePlanner";

export default function LeaveManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.is_organization_owner;

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
          {isAdmin && <TabsTrigger value="requests">All Requests</TabsTrigger>}
          <TabsTrigger value="planner">Annual Planner</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <LeaveOverview />
        </TabsContent>
        {isAdmin && (
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
