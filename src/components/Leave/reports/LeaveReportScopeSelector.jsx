import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Building, User, Search, X } from "lucide-react";

export default function LeaveReportScopeSelector({
  scope,
  setScope,
  isAdmin,
  departments = [],
  selectedDepartments = [],
  setSelectedDepartments,
  eligibleEmployees = [],
  selectedEmployeeId,
  setSelectedEmployeeId,
  reportType,
  includeItemized,
  setIncludeItemized,
}) {
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const filteredEmployeesList = useMemo(() => {
    if (!employeeSearchQuery) return eligibleEmployees;
    const q = employeeSearchQuery.toLowerCase();
    return eligibleEmployees.filter(
      (emp) =>
        (emp.fullName || emp.full_name || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.employeeCode || emp.employee_id || "").toLowerCase().includes(q)
    );
  }, [eligibleEmployees, employeeSearchQuery]);

  const selectedEmployeeObj = useMemo(() => {
    return eligibleEmployees.find((e) => (e.id || e._id) === selectedEmployeeId);
  }, [eligibleEmployees, selectedEmployeeId]);

  return (
    <div className="space-y-4">
      {/* Scope Level Selector Cards */}
      <div>
        <Label className="text-xs font-semibold text-slate-700 mb-2 block">
          1. Report Scope Level
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setScope("team")}
            className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
              scope === "team"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                scope === "team" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Team-Wide / Org</p>
              <p
                className={`text-[11px] truncate leading-tight mt-0.5 ${
                  scope === "team" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {isAdmin ? "All active employees across org" : "Your direct reporting team"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScope("department")}
            className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
              scope === "department"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                scope === "department" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Department-Wide</p>
              <p
                className={`text-[11px] truncate leading-tight mt-0.5 ${
                  scope === "department" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Filter by one or multiple departments
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScope("individual")}
            className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
              scope === "individual"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                scope === "individual" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">Individual Employee</p>
              <p
                className={`text-[11px] truncate leading-tight mt-0.5 ${
                  scope === "individual" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Detailed single-employee audit
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Department Selector */}
      {scope === "department" && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <Label className="text-xs font-medium text-slate-700">Select Department(s):</Label>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => {
              const deptId = dept.id || dept._id;
              const isSelected = selectedDepartments.includes(deptId);
              return (
                <button
                  key={deptId}
                  type="button"
                  onClick={() => {
                    setSelectedDepartments((prev) =>
                      isSelected ? prev.filter((id) => id !== deptId) : [...prev, deptId]
                    );
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Building className="w-3 h-3" />
                  <span>{dept.name}</span>
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </button>
              );
            })}
          </div>
          {selectedDepartments.length === 0 && (
            <p className="text-[11px] text-rose-500 mt-1">
              Please select at least one department to export.
            </p>
          )}
        </div>
      )}

      {/* Individual Employee Selector */}
      {scope === "individual" && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <Label className="text-xs font-medium text-slate-700">Search & Select Employee:</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                placeholder="Search by name, email, or code..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                className="pl-9 text-xs h-10 bg-white"
              />
            </div>

            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="h-10 text-xs bg-white">
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 text-xs">
                {filteredEmployeesList.map((emp) => {
                  const empId = emp.id || emp._id;
                  return (
                    <SelectItem key={empId} value={empId}>
                      {emp.fullName || emp.full_name} ({emp.employeeCode || emp.employee_id || emp.email})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedEmployeeObj && (
            <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {(selectedEmployeeObj.fullName || selectedEmployeeObj.full_name || "E")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {selectedEmployeeObj.fullName || selectedEmployeeObj.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedEmployeeObj.email} • {selectedEmployeeObj.jobTitle || "Team Member"} •{" "}
                    {selectedEmployeeObj.department?.name || "Department"}
                  </p>
                </div>
              </div>
              {reportType === "summary" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeItemized"
                    checked={includeItemized}
                    onCheckedChange={setIncludeItemized}
                  />
                  <Label
                    htmlFor="includeItemized"
                    className="text-xs font-normal text-slate-700 cursor-pointer"
                  >
                    Include Itemized Requests Sheet
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
