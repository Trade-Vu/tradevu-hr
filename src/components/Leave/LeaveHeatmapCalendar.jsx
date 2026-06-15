import React, { useState, useMemo, useEffect } from "react";
import { 
  eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, 
  startOfYear, endOfYear, format, getDay, isWeekend
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "@/api/graphqlClient";
import { gql } from "graphql-request";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function LeaveHeatmapCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const isAdmin = user?.role === 'admin' || user?.is_organization_owner;

  const [selectedDates, setSelectedDates] = useState([]);
  const [viewMode, setViewMode] = useState("personal"); // personal or team

  // Generate calendar dates by month
  const months = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    return eachMonthOfInterval({ start: yearStart, end: yearEnd }).map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const prefix = Array.from({ length: getDay(monthStart) }).map(() => null);
      return { monthStart, days, prefix };
    });
  }, [currentYear]);

  // Fetch data
  const { data: myPlan, isLoading: myPlanLoading } = useQuery({
    queryKey: ['myLeavePlan', currentYear],
    queryFn: async () => {
      const QUERY = gql`
        query GetMyLeavePlan($year: Int!) {
          myLeavePlans(year: $year) { id plannedDates status }
        }
      `;
      const data = await gqlClient.request(QUERY, { year: currentYear });
      return data.myLeavePlans?.[0] || null;
    }
  });

  const { data: teamPlans, isLoading: teamPlansLoading } = useQuery({
    queryKey: ['teamLeavePlans', currentYear],
    queryFn: async () => {
      const QUERY = gql`
        query GetTeamLeavePlans($year: Int!) {
          teamLeavePlans(year: $year) { id plannedDates employee { fullName } }
        }
      `;
      const data = await gqlClient.request(QUERY, { year: currentYear });
      return data.teamLeavePlans || [];
    },
    enabled: isAdmin
  });

  // Calculate team conflict heatmap
  const teamDateCounts = useMemo(() => {
    if (!teamPlans) return {};
    const counts = {};
    teamPlans.forEach(plan => {
      plan.plannedDates.forEach(date => {
        counts[date] = (counts[date] || 0) + 1;
      });
    });
    return counts;
  }, [teamPlans]);

  // Sync selected dates from backend
  useEffect(() => {
    if (myPlan && myPlan.plannedDates) {
      setSelectedDates(myPlan.plannedDates);
    }
  }, [myPlan]);

  const submitMutation = useMutation({
    mutationFn: async (dates) => {
      const MUTATION = gql`
        mutation SubmitLeavePlan($year: Int!, $plannedDates: [String!]!) {
          submitLeavePlan(year: $year, plannedDates: $plannedDates) {
            id status
          }
        }
      `;
      return gqlClient.request(MUTATION, { year: currentYear, plannedDates: dates });
    },
    onSuccess: () => {
      toast.success("Leave plan submitted for approval");
      queryClient.invalidateQueries({ queryKey: ['myLeavePlan'] });
    },
    onError: (err) => {
      toast.error("Failed to submit plan");
      console.error(err);
    }
  });

  const handleDayClick = (day) => {
    if (!day || viewMode === "team") return;
    if (isWeekend(day)) return; // Don't allow selecting weekends

    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const getCellClasses = (day) => {
    if (!day) return "bg-transparent";
    
    const dateStr = format(day, "yyyy-MM-dd");
    const weekend = isWeekend(day);

    if (viewMode === "personal") {
      if (selectedDates.includes(dateStr)) return "bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-sm border border-green-600 font-medium";
      if (weekend) return "bg-slate-50 dark:bg-slate-800/40 text-muted-foreground/60 cursor-not-allowed";
      return "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border border-transparent";
    } else {
      // Team mode - heatmap
      if (weekend) return "bg-slate-50 dark:bg-slate-800/40 text-muted-foreground/60 border border-transparent";
      const count = teamDateCounts[dateStr] || 0;
      if (count === 0) return "bg-slate-100 dark:bg-slate-800 border border-transparent";
      if (count === 1) return "bg-orange-300 text-orange-950 font-medium border border-orange-400";
      if (count === 2) return "bg-orange-500 text-white font-medium border border-orange-600 shadow-sm";
      return "bg-red-600 text-white font-medium border border-red-700 shadow-sm";
    }
  };

  const getTooltipContent = (day) => {
    if (!day) return null;
    const dateStr = format(day, "yyyy-MM-dd");
    if (viewMode === "personal") {
      return format(day, "MMMM d, yyyy");
    } else {
      const count = teamDateCounts[dateStr] || 0;
      return `${format(day, "MMMM d, yyyy")}: ${count} team member(s) planned`;
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between bg-muted/20 gap-4">
        <div>
          <CardTitle>Annual Leave Planner - {currentYear}</CardTitle>
          <CardDescription className="max-w-xl mt-1.5">
            {viewMode === "personal" 
              ? "Select days to map out your planned leave for the year. Weekends are automatically excluded."
              : "Viewing aggregated team leave plans. Darker colors indicate multiple team members have planned leave on the same day."}
          </CardDescription>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setViewMode(v => v === "personal" ? "team" : "personal")}
            >
              {viewMode === "personal" ? "View Team Conflicts" : "View Personal Plan"}
            </Button>
          )}
          {viewMode === "personal" && (
            <Button 
              onClick={() => submitMutation.mutate(selectedDates)}
              disabled={submitMutation.isPending || (myPlan?.status === 'APPROVED')}
              className="bg-primary hover:bg-primary/90"
            >
              {submitMutation.isPending ? "Submitting..." : myPlan?.status === 'APPROVED' ? "Plan Approved" : "Submit Plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-sm border border-green-600 shadow-sm"></div>
              <span>Total Planned Days: {selectedDates.length}</span>
            </div>
            {myPlan && (
              <div className="flex items-center gap-2">
                Status: 
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  myPlan.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                  myPlan.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {myPlan.status}
                </span>
              </div>
            )}
          </div>
          
          {/* Calendar Grid - Month by Month */}
          <TooltipProvider delayDuration={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">
              {months.map(({ monthStart, days, prefix }, mIndex) => (
                <div key={mIndex} className="flex flex-col">
                  <h4 className="font-semibold text-[15px] mb-3 text-center">
                    {format(monthStart, 'MMMM')}
                  </h4>
                  
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs text-muted-foreground font-medium">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {[...prefix, ...days].map((day, i) => {
                      if (!day) return <div key={i} className="aspect-square" />;
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => handleDayClick(day)}
                              className={`aspect-square flex items-center justify-center text-[11px] rounded-md transition-all duration-200 ease-in-out select-none ${getCellClasses(day)}`}
                            >
                              {format(day, 'd')}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground shadow-md border">
                            <p className="font-medium text-sm">{getTooltipContent(day)}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TooltipProvider>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t text-sm text-muted-foreground justify-end">
            {viewMode === "team" ? (
              <>
                <span>Less conflicts</span>
                <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                <div className="w-4 h-4 rounded-sm bg-orange-300 border border-orange-400"></div>
                <div className="w-4 h-4 rounded-sm bg-orange-500 border border-orange-600 shadow-sm"></div>
                <div className="w-4 h-4 rounded-sm bg-red-600 border border-red-700 shadow-sm"></div>
                <span>More conflicts</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mr-4">
                  <div className="w-4 h-4 rounded-sm bg-slate-50 dark:bg-slate-800/40"></div>
                  <span>Weekend</span>
                </div>
                <div className="flex items-center gap-1.5 mr-4">
                  <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm bg-green-500 border border-green-600 shadow-sm"></div>
                  <span>Planned</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
