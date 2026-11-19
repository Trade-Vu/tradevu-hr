import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeaveReportSecondaryFilters({
  reportType,
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
}) {
  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Range Preset */}
        <div>
          <Label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Date Window / Period:
          </Label>
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="YEAR">Full Year (2026)</SelectItem>
              <SelectItem value="CURRENT_MONTH">Current Month</SelectItem>
              <SelectItem value="NEXT_MONTH">Next Month</SelectItem>
              <SelectItem value="Q4">Quarter 4 (Q4 2026)</SelectItem>
              <SelectItem value="Q1_NEXT">Quarter 1 Next Year (Q1 2027)</SelectItem>
              <SelectItem value="CUSTOM">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leave Type Filter */}
        <div>
          <Label className="text-xs font-medium text-slate-700 mb-1.5 block">Leave Type:</Label>
          <Select value={selectedLeaveTypeId} onValueChange={setSelectedLeaveTypeId}>
            <SelectTrigger className="h-9 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">All Leave Types</SelectItem>
              {leaveTypes.map((lt) => (
                <SelectItem key={lt.id || lt._id} value={lt.id || lt._id}>
                  {lt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Planning Status Filter / Disclaimer */}
        {reportType === "planning" ? (
          <div>
            <Label className="text-xs font-medium text-slate-700 mb-1.5 block">Planning Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="ALL">All Planned (Approved & Pending)</SelectItem>
                <SelectItem value="APPROVED">Approved Only</SelectItem>
                <SelectItem value="PENDING">Pending Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-end">
            <p className="text-[11px] text-slate-500 italic pb-2">
              Balances calculated using Tradevu leave engine respecting confirmation proration & accrual.
            </p>
          </div>
        )}
      </div>

      {/* Custom Date Inputs */}
      {datePreset === "CUSTOM" && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <Label className="text-[11px] text-slate-600 mb-1 block">Start Date</Label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 text-xs bg-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-600 mb-1 block">End Date</Label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 text-xs bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
