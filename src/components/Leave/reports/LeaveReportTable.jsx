import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileSpreadsheet, Loader2 } from "lucide-react";

import LeaveReportGroupedTable from "./LeaveReportGroupedTable";
import LeaveReportRawTable from "./LeaveReportRawTable";
import LeaveReportPagination from "./LeaveReportPagination";

export default function LeaveReportTable({
  headers = [],
  rows = [],
  groupedEmployees = [],
  itemizedSheet = null,
  loadingPreview = false,
  reportType = "summary",
  previewTab = "main",
  setPreviewTab,
}) {
  const [tableSearch, setTableSearch] = useState("");
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "detailed"
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset pagination on state switches
  useEffect(() => {
    setCurrentPage(1);
  }, [tableSearch, viewMode, previewTab, reportType, pageSize]);

  // Filtered rows for raw table
  const filteredRows = useMemo(() => {
    if (!tableSearch) return rows;
    const q = tableSearch.toLowerCase();
    return rows.filter((r) => r.some((c) => String(c || "").toLowerCase().includes(q)));
  }, [rows, tableSearch]);

  // Filtered grouped employees for master-detail table
  const filteredGrouped = useMemo(() => {
    if (!tableSearch) return groupedEmployees;
    const q = tableSearch.toLowerCase();
    return groupedEmployees.filter(
      (emp) =>
        emp.fullName?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
    );
  }, [groupedEmployees, tableSearch]);

  // Filtered itemized requests
  const filteredItemizedRows = useMemo(() => {
    if (!itemizedSheet || !itemizedSheet.rows) return [];
    if (!tableSearch) return itemizedSheet.rows;
    const q = tableSearch.toLowerCase();
    return itemizedSheet.rows.filter((r) => r.some((c) => String(c || "").toLowerCase().includes(q)));
  }, [itemizedSheet, tableSearch]);

  // Active dataset count & pagination calculation
  const totalCount = useMemo(() => {
    if (previewTab === "itemized") return filteredItemizedRows.length;
    if (reportType === "summary" && viewMode === "grouped") return filteredGrouped.length;
    return filteredRows.length;
  }, [previewTab, reportType, viewMode, filteredItemizedRows.length, filteredGrouped.length, filteredRows.length]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  // Paginated slices
  const paginatedGrouped = useMemo(() => {
    return filteredGrouped.slice(startIndex, startIndex + pageSize);
  }, [filteredGrouped, startIndex, pageSize]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, startIndex, pageSize]);

  const paginatedItemizedRows = useMemo(() => {
    return filteredItemizedRows.slice(startIndex, startIndex + pageSize);
  }, [filteredItemizedRows, startIndex, pageSize]);

  // Accordion toggle handlers
  const toggleExpandEmployee = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedKeys(new Set(filteredGrouped.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
      {/* Table Header Bar */}
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Live Data Preview
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium bg-white text-slate-600 border-slate-200">
              {reportType === "summary" && viewMode === "grouped"
                ? `${filteredGrouped.length} employees (${rows.length} policy rows)`
                : `${totalCount} ${reportType === "planning" ? "requests" : "rows"}`}
            </Badge>

            {/* View Mode Switcher for Leave Balances Summary */}
            {reportType === "summary" && !itemizedSheet && (
              <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs ml-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grouped")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    viewMode === "grouped"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Grouped by Employee
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("detailed")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    viewMode === "detailed"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Raw Export Table ({rows.length})
                </button>
              </div>
            )}

            {/* Itemized Requests Tab for Individual Scope */}
            {itemizedSheet && (
              <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs ml-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab("main")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    previewTab === "main" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Leave Balances ({rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("itemized")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    previewTab === "itemized" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                  }`}
                >
                  Itemized Requests ({itemizedSheet.rows?.length || 0})
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {reportType === "summary" && viewMode === "grouped" && filteredGrouped.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={expandedKeys.size === filteredGrouped.length ? collapseAll : expandAll}
                className="h-8 text-xs text-slate-600 hover:text-slate-900 px-2.5"
              >
                {expandedKeys.size === filteredGrouped.length ? "Collapse All" : "Expand All"}
              </Button>
            )}

            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Filter preview rows..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loadingPreview ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-600" />
            <p className="text-xs font-medium">Calculating leave entitlement & balances...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              No leave records match the selected scope and criteria. Try selecting another department or date window.
            </p>
          </div>
        ) : previewTab === "itemized" && itemizedSheet ? (
          <LeaveReportRawTable
            headers={itemizedSheet.headers}
            rows={paginatedItemizedRows}
            isItemized
          />
        ) : reportType === "summary" && viewMode === "grouped" ? (
          <LeaveReportGroupedTable
            paginatedGrouped={paginatedGrouped}
            expandedKeys={expandedKeys}
            toggleExpandEmployee={toggleExpandEmployee}
          />
        ) : (
          <LeaveReportRawTable
            headers={headers}
            rows={paginatedRows}
            reportType={reportType}
          />
        )}

        {/* Unified Pagination Footer */}
        <LeaveReportPagination
          startIndex={startIndex}
          endIndex={endIndex}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
          itemLabel={reportType === "summary" && viewMode === "grouped" ? "employees" : "records"}
        />
      </CardContent>
    </Card>
  );
}
