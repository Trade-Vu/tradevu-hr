import React from "react";
import LeaveHeatmapCalendar from "@/components/Leave/LeaveHeatmapCalendar";

export default function LeavePlanner() {
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
    </div>
  );
}
