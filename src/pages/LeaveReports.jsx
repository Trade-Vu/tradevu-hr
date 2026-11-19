import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { leaveApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useLeaveTypes } from "@/hooks/useLeaveTypesQuery";
import { useLeaveEligibleEmployees } from "@/hooks/useLeaveEligibleEmployeesQuery";
import { isSuperAdmin, isHrAdmin, isManager as checkIsManager } from "@/lib/roleUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import LeaveReportFilters from "@/components/Leave/reports/LeaveReportFilters";
import LeaveReportMetrics from "@/components/Leave/reports/LeaveReportMetrics";
import LeaveReportTable from "@/components/Leave/reports/LeaveReportTable";
import {
  resolveDatePreset,
  calculateLeaveMetrics,
  groupLeaveSummaryByEmployee,
  generateClientFallbackPreview,
  executeLeaveExport,
} from "@/components/Leave/reports/leaveReportUtils";

export default function LeaveReports() {
  const { user } = useAuth();
  const isAdmin = isSuperAdmin(user) || isHrAdmin(user);
  const isManager = checkIsManager(user) && !isAdmin;

  // Filter States
  const [reportType, setReportType] = useState("summary"); // "summary" | "planning"
  const [scope, setScope] = useState("team"); // "team" | "department" | "individual"
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "APPROVED" | "PENDING"
  const [datePreset, setDatePreset] = useState("YEAR");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeItemized, setIncludeItemized] = useState(true);
  const [previewTab, setPreviewTab] = useState("main"); // "main" | "itemized"
  const [isExporting, setIsExporting] = useState(false);

  // Queries for reference data
  const { data: departments = [] } = useDepartments();
  const { data: rawLeaveTypes = [] } = useLeaveTypes();
  const { data: eligibleEmployees = [] } = useLeaveEligibleEmployees();

  // Filter active leave policies
  const leaveTypes = useMemo(() => {
    return Array.isArray(rawLeaveTypes) ? rawLeaveTypes.filter((t) => t.isActive !== false) : [];
  }, [rawLeaveTypes]);

  // Constrain default department scope for managers
  useEffect(() => {
    if (isManager && user?.employeeId?.departmentId && selectedDepartments.length === 0) {
      const deptId =
        typeof user.employeeId.departmentId === "object"
          ? user.employeeId.departmentId._id || user.employeeId.departmentId.id
          : user.employeeId.departmentId;
      if (deptId) setSelectedDepartments([String(deptId)]);
    }
  }, [isManager, user]);

  // Compute resolved date range
  const resolvedDateRange = useMemo(() => {
    return resolveDatePreset(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  // Request parameters for preview and export
  const exportParams = useMemo(() => {
    return {
      reportType,
      scope,
      scopeIds:
        scope === "department"
          ? selectedDepartments
          : scope === "individual"
          ? selectedEmployeeId
            ? [selectedEmployeeId]
            : []
          : [],
      dateRange: resolvedDateRange,
      statusFilter,
      leaveTypeId: selectedLeaveTypeId === "all" ? null : selectedLeaveTypeId,
      includeItemized,
    };
  }, [
    reportType,
    scope,
    selectedDepartments,
    selectedEmployeeId,
    resolvedDateRange,
    statusFilter,
    selectedLeaveTypeId,
    includeItemized,
  ]);

  // Fetch Preview Data via API or calculate with local fallback
  const {
    data: previewResponse,
    isLoading: loadingPreview,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["leave-export-preview", exportParams],
    queryFn: async () => {
      try {
        const res = await leaveApi.getLeaveReportPreview(exportParams);
        return res?.data || res;
      } catch (err) {
        return generateClientFallbackPreview({
          employees: eligibleEmployees,
          leaveTypes,
          params: exportParams,
          user,
        });
      }
    },
    enabled: Boolean(user && (scope !== "individual" || selectedEmployeeId)),
    staleTime: 30000,
  });

  const previewData = previewResponse?.data || previewResponse || { headers: [], rows: [] };
  const headers = previewData.headers || [];
  const rows = previewData.rows || [];
  const itemizedSheet = previewData.itemizedSheet || null;

  // Group summary rows by employee to eliminate Cartesian repetition
  const groupedEmployees = useMemo(() => {
    return groupLeaveSummaryByEmployee(rows);
  }, [rows]);

  // Summary Metrics calculation
  const metrics = useMemo(() => {
    return calculateLeaveMetrics(reportType, rows);
  }, [reportType, rows]);

  // Full-Dataset Export Handler (Exports all records regardless of UI pagination)
  const handleExport = async (format) => {
    if (scope === "individual" && !selectedEmployeeId) {
      toast.error("Please select an employee for Individual scope export.");
      return;
    }
    if (scope === "department" && selectedDepartments.length === 0) {
      toast.error("Please select at least one department for Department-Wide export.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);

    try {
      const filename = await executeLeaveExport({
        format,
        exportParams,
        headers,
        rows,
        itemizedSheet,
        reportType,
        scope,
        selectedDepartments,
        departments,
        selectedEmployeeId,
        eligibleEmployees,
        resolvedDateRange,
        leaveApi,
      });

      toast.success(`Successfully exported ${filename}`, { id: toastId });
    } catch (err) {
      toast.error(`Export failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Leave Reports & Planning Export
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, preview, and download scoped leave balance summaries, audit records, and forward-looking capacity planning reports.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPreview()}
            disabled={loadingPreview || isExporting}
            className="h-10 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isExporting || rows.length === 0}
                className="h-10 px-4 bg-slate-900 text-white hover:bg-slate-800 font-medium rounded-lg shadow-sm flex items-center gap-2 transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border border-slate-200">
              <DropdownMenuItem
                onClick={() => handleExport("xlsx")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div className="flex flex-col">
                  <span>Download as Excel</span>
                  <span className="text-[10px] text-slate-400">Microsoft Excel (.xlsx)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("csv")}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <div className="flex flex-col">
                  <span>Download as CSV</span>
                  <span className="text-[10px] text-slate-400">Comma-Separated Values (.csv)</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter and Scope Configuration */}
      <LeaveReportFilters
        reportType={reportType}
        setReportType={setReportType}
        scope={scope}
        setScope={setScope}
        isAdmin={isAdmin}
        departments={departments}
        selectedDepartments={selectedDepartments}
        setSelectedDepartments={setSelectedDepartments}
        eligibleEmployees={eligibleEmployees}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        includeItemized={includeItemized}
        setIncludeItemized={setIncludeItemized}
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
        onModeChange={() => setPreviewTab("main")}
      />

      {/* Summary Metrics Cards */}
      <LeaveReportMetrics metrics={metrics} />

      {/* Paginated Live Preview Table */}
      <LeaveReportTable
        headers={headers}
        rows={rows}
        groupedEmployees={groupedEmployees}
        itemizedSheet={itemizedSheet}
        loadingPreview={loadingPreview}
        reportType={reportType}
        previewTab={previewTab}
        setPreviewTab={setPreviewTab}
      />
    </div>
  );
}
