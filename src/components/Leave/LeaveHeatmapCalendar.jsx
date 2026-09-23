import React, { useState, useMemo, useEffect } from "react";
import {
  eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfYear, endOfYear, format, getDay, isWeekend
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi } from "@/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { getNormalizedRole, isManager as isManagerRole } from "@/lib/roleUtils";
import { extractErrorMessage } from "@/lib/utils";

export default function LeaveHeatmapCalendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const role = getNormalizedRole(user);
  // Mirrors the backend's own admin/manager gate in leave.service.ts (SUPER_ADMIN/HR_ADMIN see all
  // departments, MANAGER is auto-scoped to their own) so the UI never offers a filter the API won't honor.
  const isOrgAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const canViewTeam = isOrgAdmin || isManagerRole(user);
  // SUPER_ADMIN gets a view-only calendar: no personal plan to submit, so keep them on the team heatmap.
  const isSuperAdminUser = role === 'SUPER_ADMIN';

  const [selectedDates, setSelectedDates] = useState([]);
  const [viewMode, setViewMode] = useState("team"); // Default to team to show holistic calendar
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

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

  const { data: holidays } = useQuery({
    queryKey: ['leave-holidays'],
    queryFn: async () => {
      const res = await leaveApi.getPublicHolidays();
      return Array.isArray(res) ? res : res?.data || [];
    },
  });
  const holidayMap = useMemo(() => {
    const map = new Map();
    (holidays || []).forEach((h) => map.set(format(new Date(h.date), "yyyy-MM-dd"), h.name));
    return map;
  }, [holidays]);

  const { data: myPlan, isLoading: myPlanLoading, isError: myPlanError } = useQuery({
    queryKey: ['leave-plan-my', currentYear],
    queryFn: () => leaveApi.getMyLeavePlan(currentYear),
    // SUPER_ADMIN has no employee record/leave plan of their own, so this endpoint would 404.
    enabled: !isSuperAdminUser,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance-my', currentYear],
    queryFn: () => leaveApi.getMyBalance(currentYear),
    enabled: !isSuperAdminUser,
  });

  const annualBalance = useMemo(() => {
    const list = balanceData?.balances || [];
    return (
      list.find(
        (b) =>
          b.leaveTypeId?.name?.toLowerCase().includes("annual") ||
          b.leaveTypeId?.code?.toLowerCase() === "annual",
      ) || list[0]
    );
  }, [balanceData]);

  // Total annual leave days available to plan:
  // If myPlan already has pending plannedDates, those may count towards pending in the balance,
  // so we add back pending plan dates from the current plan to give the true allowance for this plan.
  const availableAnnualDays = useMemo(() => {
    if (!annualBalance) return null;
    const baseRemaining = annualBalance.remaining ?? 0;
    const planPendingAdjustment = myPlan?.status === 'PENDING' ? (myPlan.plannedDates?.length || 0) : 0;
    return Math.max(0, baseRemaining + planPendingAdjustment);
  }, [annualBalance, myPlan]);

  const departmentId = selectedDepartment === "all" ? undefined : selectedDepartment;
  const { data: departments } = useDepartments({ enabled: isOrgAdmin });
  const selectedDepartmentInfo = departments?.find((d) => d.id === selectedDepartment);

  const { data: teamPlans, isLoading: teamPlansLoading, isError: teamPlansError } = useQuery({
    queryKey: ['leave-plans-team', currentYear, departmentId || null],
    queryFn: async () => {
      const res = await leaveApi.getTeamLeavePlans(currentYear, departmentId);
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: canViewTeam,
  });

  const { data: approvedLeaves, isLoading: approvedLeavesLoading, isError: approvedLeavesError } = useQuery({
    queryKey: ['leave-calendar', currentYear, departmentId || null],
    queryFn: async () => {
      const res = await leaveApi.getLeaveCalendar(currentYear, departmentId);
      return Array.isArray(res) ? res : res?.data || [];
    },
  });

  // Calculate team conflict heatmap including approved leaves
  const teamDateData = useMemo(() => {
    const counts = {};
    const details = {};

    const addDetail = (date, name, type) => {
      if (!details[date]) details[date] = [];
      if (!details[date].some(d => d.name === name && d.type === type)) {
        details[date].push({ name, type });
      }
    };

    if (teamPlans) {
      teamPlans.forEach(plan => {
        (plan.plannedDates || []).forEach(date => {
          addDetail(date, plan.employeeId?.fullName || 'Employee', 'Planned');
        });
      });
    }

    if (approvedLeaves) {
      approvedLeaves.forEach(leave => {
        try {
          const days = eachDayOfInterval({ start: new Date(leave.startDate), end: new Date(leave.endDate) });
          days.forEach((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            if (!isWeekend(d) && !holidayMap.has(dateStr)) {
              addDetail(dateStr, leave.employeeId?.fullName || 'Employee', 'Approved');
            }
          });
        } catch (err) {
          console.error("Invalid leave dates:", leave);
        }
      });
    }

    for (const [date, info] of Object.entries(details)) {
      const uniqueNames = [...new Set(info.map(i => i.name))];
      counts[date] = uniqueNames.length;
    }

    return { counts, details };
  }, [teamPlans, approvedLeaves, holidayMap]);

  const capacityLimit = selectedDepartmentInfo?.maxConcurrentLeave;
  const isOverCapacity = (dateStr) => Boolean(capacityLimit) && (teamDateData.counts[dateStr] || 0) > capacityLimit;

  // Sync selected dates from backend
  useEffect(() => {
    if (myPlan && myPlan.plannedDates) {
      setSelectedDates(myPlan.plannedDates);
    }
  }, [myPlan]);

  const submitMutation = useMutation({
    mutationFn: (dates) => leaveApi.submitLeavePlan(currentYear, dates),
    onSuccess: () => {
      toast.success("Leave plan submitted. Leave requests have been generated for approval.");
      queryClient.invalidateQueries({ queryKey: ['leave-plan-my', currentYear] });
      queryClient.invalidateQueries({ queryKey: ['leave-plans-team'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance-my', currentYear] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.refetchQueries({ queryKey: ['pendingApprovalsCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      const msg = extractErrorMessage(err, "Failed to submit plan");
      toast.error(msg);
      console.error(err);
    }
  });

  const isSelectableDay = (day) => {
    if (isWeekend(day)) return false;
    if (holidayMap.has(format(day, "yyyy-MM-dd"))) return false;
    return true;
  };

  const handleDayClick = (day) => {
    if (!day || viewMode === "team") return;
    if (!isSelectableDay(day)) return;

    const dateStr = format(day, "yyyy-MM-dd");
    const isAlreadySelected = selectedDates.includes(dateStr);

    if (!isAlreadySelected && availableAnnualDays !== null && selectedDates.length >= availableAnnualDays) {
      toast.error(`You cannot plan more than your available annual leave days (${availableAnnualDays} days available).`);
      return;
    }

    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleAddRange = () => {
    if (!rangeStart || !rangeEnd) return;
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (start > end) {
      toast.error("Start date must be before end date");
      return;
    }
    const days = eachDayOfInterval({ start, end });
    const newDates = [];
    days.forEach(day => {
      if (isSelectableDay(day)) {
        newDates.push(format(day, "yyyy-MM-dd"));
      }
    });

    const datesToAdd = newDates.filter(d => !selectedDates.includes(d));
    if (availableAnnualDays !== null && selectedDates.length + datesToAdd.length > availableAnnualDays) {
      toast.error(
        `Adding these dates would exceed your available annual leave days (${availableAnnualDays} days max, ${selectedDates.length + datesToAdd.length} attempted).`
      );
      return;
    }

    setSelectedDates(prev => {
      const merged = new Set([...prev, ...newDates]);
      return Array.from(merged).sort();
    });
    setRangeStart("");
    setRangeEnd("");
    toast.success(`Added ${datesToAdd.length} days to plan.`);
  };

  const getCellClasses = (day) => {
    if (!day) return "bg-transparent";

    const dateStr = format(day, "yyyy-MM-dd");
    const weekend = isWeekend(day);
    const holiday = holidayMap.has(dateStr);
    const overCapacity = viewMode === "team" && isOverCapacity(dateStr);
    const ring = overCapacity ? " ring-2 ring-red-500 ring-offset-1" : "";

    if (viewMode === "personal") {
      if (selectedDates.includes(dateStr)) return "bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-sm border border-green-600 font-medium";
      if (holiday) return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 cursor-not-allowed border border-sky-200 dark:border-sky-900";
      if (weekend) return "bg-slate-50 dark:bg-slate-800/40 text-muted-foreground/60 cursor-not-allowed";
      return "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer border border-transparent";
    } else {
      // Team mode - heatmap
      if (holiday) return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900";
      if (weekend) return "bg-slate-50 dark:bg-slate-800/40 text-muted-foreground/60 border border-transparent";
      const count = teamDateData.counts[dateStr] || 0;
      if (count === 0) return "bg-slate-100 dark:bg-slate-800 border border-transparent" + ring;

      const details = teamDateData.details[dateStr] || [];
      const hasApproved = details.some(d => d.type === 'Approved');

      // If approved, give a stronger color like blue/indigo instead of orange
      if (hasApproved) {
        if (count === 1) return "bg-indigo-400 text-white font-medium border border-indigo-500" + ring;
        if (count === 2) return "bg-indigo-600 text-white font-medium border border-indigo-700 shadow-sm" + ring;
        return "bg-indigo-800 text-white font-medium border border-indigo-900 shadow-sm" + ring;
      } else {
        if (count === 1) return "bg-orange-300 text-orange-950 font-medium border border-orange-400" + ring;
        if (count === 2) return "bg-orange-500 text-white font-medium border border-orange-600 shadow-sm" + ring;
        return "bg-red-600 text-white font-medium border border-red-700 shadow-sm" + ring;
      }
    }
  };

  const getTooltipContent = (day) => {
    if (!day) return null;
    const dateStr = format(day, "yyyy-MM-dd");
    const holidayName = holidayMap.get(dateStr);
    if (viewMode === "personal") {
      return (
        <div className="flex flex-col gap-1">
          <div>{format(day, "MMMM d, yyyy")}</div>
          {holidayName && <div className="text-sky-600 dark:text-sky-400">{holidayName} (public holiday)</div>}
        </div>
      );
    } else {
      const details = teamDateData.details[dateStr] || [];
      if (details.length === 0 && !holidayName) return format(day, "MMMM d, yyyy");

      const lines = details.map(d => `${d.name} (${d.type})`);
      return (
        <div className="flex flex-col gap-1">
          <div className="pb-1 mb-1 font-bold border-b">{format(day, "MMMM d, yyyy")}</div>
          {holidayName && <div className="text-sky-600 dark:text-sky-400">{holidayName} (public holiday)</div>}
          {lines.map((line, idx) => <div key={idx}>{line}</div>)}
          {isOverCapacity(dateStr) && (
            <div className="flex items-center gap-1 pt-1 mt-1 font-medium text-red-500 border-t">
              <AlertTriangle className="w-3 h-3" /> Over department capacity ({capacityLimit})
            </div>
          )}
        </div>
      );
    }
  };

  const isInitialLoading = myPlanLoading || (canViewTeam && teamPlansLoading) || approvedLeavesLoading;
  const hasLoadError = myPlanError || teamPlansError || approvedLeavesError;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center bg-muted/20">
        <div>
          <CardTitle>Annual Leave Planner - {currentYear}</CardTitle>
          <CardDescription className="max-w-xl mt-1.5">
            {viewMode === "personal"
              ? "Select days to map out your planned leave for the year. Weekends and public holidays are automatically excluded."
              : "Viewing aggregated team leave plans. Darker colors indicate multiple team members have planned leave on the same day."}
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {isOrgAdmin && viewMode === "team" && departments && departments.length > 0 && (
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                <SelectValue placeholder="Filter Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Company</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isSuperAdminUser && (
            <Button
              variant="outline"
              onClick={() => setViewMode(v => v === "personal" ? "team" : "personal")}
            >
              {viewMode === "personal" ? "View Team Calendar" : "View Personal Plan"}
            </Button>
          )}
          {viewMode === "personal" && !isSuperAdminUser && (
            <Button
              onClick={() => submitMutation.mutate(selectedDates)}
              disabled={
                submitMutation.isPending ||
                myPlan?.status === 'APPROVED' ||
                selectedDates.length === 0 ||
                (availableAnnualDays !== null && selectedDates.length > availableAnnualDays)
              }
              className="bg-primary hover:bg-primary/90"
            >
              {submitMutation.isPending
                ? "Submitting..."
                : myPlan?.status === 'APPROVED'
                ? "Plan Approved"
                : "Submit Plan"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isInitialLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading leave calendar...</span>
          </div>
        ) : hasLoadError ? (
          <div className="flex items-center justify-center gap-2 py-16 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <span>Couldn't load the leave calendar. Please try refreshing the page.</span>
          </div>
        ) : (
        <div className="flex flex-col space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-green-600 rounded-sm shadow-sm"></div>
              <span>
                Total Planned Days: <strong>{selectedDates.length}</strong>
                {viewMode === "personal" && availableAnnualDays !== null && (
                  <span className="text-muted-foreground font-normal"> / {availableAnnualDays} days available</span>
                )}
              </span>
              {viewMode === "personal" && availableAnnualDays !== null && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedDates.length > availableAnnualDays
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : selectedDates.length === availableAnnualDays
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {selectedDates.length > availableAnnualDays
                    ? `${selectedDates.length - availableAnnualDays} days over limit`
                    : `${availableAnnualDays - selectedDates.length} days remaining to plan`}
                </span>
              )}
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

          {viewMode === "personal" && !isSuperAdminUser && myPlan?.status !== 'APPROVED' && (
            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg sm:flex-row bg-muted/50 border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium whitespace-nowrap">Add Date Range:</span>
              <Input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="max-w-[160px] bg-white dark:bg-slate-900"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="max-w-[160px] bg-white dark:bg-slate-900"
              />
              <Button onClick={handleAddRange} variant="secondary">Add Range</Button>
              <Button onClick={() => setSelectedDates([])} variant="ghost" className="ml-auto text-red-500 hover:text-red-600 hover:bg-red-50">Clear All</Button>
            </div>
          )}

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
                          <TooltipContent className="border shadow-md bg-popover text-popover-foreground">
                            <div className="text-sm font-medium">{getTooltipContent(day)}</div>
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
          <div className="flex items-center justify-end gap-3 pt-6 mt-8 text-sm border-t text-muted-foreground">
            {viewMode === "team" ? (
              <>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 border rounded-sm bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900"></div>
                    <span>Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l pl-4">
                    <span className="mr-1 font-medium">Planned:</span>
                    <div className="w-4 h-4 bg-orange-300 border border-orange-400 rounded-sm"></div>
                    <span>1</span>
                    <div className="w-4 h-4 ml-1 bg-orange-500 border border-orange-600 rounded-sm shadow-sm"></div>
                    <span>2</span>
                    <div className="w-4 h-4 ml-1 bg-red-600 border border-red-700 rounded-sm shadow-sm"></div>
                    <span>3+</span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l pl-4">
                    <span className="mr-1 font-medium">Approved:</span>
                    <div className="w-4 h-4 bg-indigo-400 border border-indigo-500 rounded-sm shadow-sm"></div>
                    <span>1</span>
                    <div className="w-4 h-4 ml-1 bg-indigo-600 border border-indigo-700 rounded-sm shadow-sm"></div>
                    <span>2</span>
                    <div className="w-4 h-4 ml-1 bg-indigo-800 border border-indigo-900 rounded-sm shadow-sm"></div>
                    <span>3+</span>
                  </div>
                  {capacityLimit ? (
                    <div className="flex items-center gap-1.5 border-l pl-4">
                      <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800 ring-2 ring-red-500 ring-offset-1"></div>
                      <span>Over capacity (limit {capacityLimit})</span>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mr-4">
                  <div className="w-4 h-4 rounded-sm bg-slate-50 dark:bg-slate-800/40"></div>
                  <span>Weekend</span>
                </div>
                <div className="flex items-center gap-1.5 mr-4">
                  <div className="w-4 h-4 border rounded-sm bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900"></div>
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-1.5 mr-4">
                  <div className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-green-500 border border-green-600 rounded-sm shadow-sm"></div>
                  <span>Planned</span>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
