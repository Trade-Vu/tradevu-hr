import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
import LeaveReportScopeSelector from "./LeaveReportScopeSelector";
import LeaveReportSecondaryFilters from "./LeaveReportSecondaryFilters";

export default function LeaveReportFilters({
  reportType,
  setReportType,
  scope,
  setScope,
  isAdmin,
  departments = [],
  selectedDepartments = [],
  setSelectedDepartments,
  eligibleEmployees = [],
  selectedEmployeeId,
  setSelectedEmployeeId,
  includeItemized,
  setIncludeItemized,
  datePreset,
  setDatePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  selectedLeaveTypeId,
  setSelectedLeaveTypeId,
  leaveTypes = [],
  statusFilter,
  setStatusFilter,
  onModeChange,
}) {
  return (
    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <CardTitle className="text-sm font-semibold text-slate-800">
              Export Scope & Filters
            </CardTitle>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setReportType("summary");
                onModeChange?.();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                reportType === "summary"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Leave Balances & Utilization
            </button>
            <button
              type="button"
              onClick={() => {
                setReportType("planning");
                onModeChange?.();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                reportType === "planning"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Leave Planning (Forward-Looking)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Scope Level & Target Employee / Department Controls */}
        <LeaveReportScopeSelector
          scope={scope}
          setScope={setScope}
          isAdmin={isAdmin}
          departments={departments}
          selectedDepartments={selectedDepartments}
          setSelectedDepartments={setSelectedDepartments}
          eligibleEmployees={eligibleEmployees}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          reportType={reportType}
          includeItemized={includeItemized}
          setIncludeItemized={setIncludeItemized}
        />

        {/* Date Window, Policy & Planning Status Filters */}
        <LeaveReportSecondaryFilters
          reportType={reportType}
          datePreset={datePreset}
          setDatePreset={setDatePreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          selectedLeaveTypeId={selectedLeaveTypeId}
          setSelectedLeaveTypeId={setSelectedLeaveTypeId}
          leaveTypes={leaveTypes}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </CardContent>
    </Card>
  );
}
