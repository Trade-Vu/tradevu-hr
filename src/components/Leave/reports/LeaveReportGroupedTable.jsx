import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Briefcase } from "lucide-react";
import { getInitials } from "./leaveReportUtils";

export default function LeaveReportGroupedTable({
  paginatedGrouped = [],
  expandedKeys = new Set(),
  toggleExpandEmployee,
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/90 border-b border-slate-200">
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 pl-5 w-[300px]">
              Employee
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 w-[200px]">
              Department & Employment
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 w-[150px]">
              Confirmation Status
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 text-right w-[120px]">
              Days Taken
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 text-right w-[140px]">
              Total Available
            </TableHead>
            <TableHead className="text-[11px] font-semibold text-slate-700 py-3 text-right pr-5 w-[140px]">
              Policy Breakdown
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedGrouped.map((emp) => {
            const isExpanded = expandedKeys.has(emp.key);
            const isConfirmed = emp.confirmationStatus === "Confirmed";

            return (
              <React.Fragment key={emp.key}>
                <TableRow
                  className={`border-b border-slate-100 transition-colors ${
                    isExpanded ? "bg-slate-50/60" : "hover:bg-slate-50/40"
                  }`}
                >
                  {/* Compound Employee: Avatar + Name + Code & Email */}
                  <TableCell className="py-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
                        {getInitials(emp.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 leading-tight">
                          {emp.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">
                          {emp.employeeId} • {emp.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Department & Employment Type */}
                  <TableCell className="py-3">
                    <p className="text-xs font-medium text-slate-800 leading-tight">
                      {emp.department || "Unassigned"}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5 capitalize">
                      {String(emp.employmentType || "").toLowerCase().replace("_", " ")} •{" "}
                      {emp.employeeClass || "Standard"}
                    </p>
                  </TableCell>

                  {/* Confirmation Status Badge */}
                  <TableCell className="py-3">
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Probation
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {emp.confirmationDate && emp.confirmationDate !== "N/A"
                        ? `Date: ${emp.confirmationDate}`
                        : "Date: N/A"}
                    </p>
                  </TableCell>

                  {/* Total Days Taken */}
                  <TableCell className="py-3 text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {emp.totalTaken.toFixed(1)} d
                    </span>
                    {emp.totalPending > 0 && (
                      <p className="text-[10px] text-amber-600 font-medium">
                        ({emp.totalPending.toFixed(1)} pending)
                      </p>
                    )}
                  </TableCell>

                  {/* Net Available Balance */}
                  <TableCell className="py-3 text-right">
                    <span className="text-xs font-bold text-emerald-700">
                      {emp.totalAvailable.toFixed(1)} d
                    </span>
                    <p className="text-[10px] text-slate-400">
                      of {emp.totalEntitled.toFixed(1)} entitled
                    </p>
                  </TableCell>

                  {/* Expand/Collapse Action */}
                  <TableCell className="py-3 text-right pr-5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpandEmployee(emp.key)}
                      className={`h-7 px-2.5 text-xs font-medium rounded-lg transition-all gap-1.5 ${
                        isExpanded
                          ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>{emp.policies.length} Policies</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Nested Policy Breakdown Accordion */}
                {isExpanded && (
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                    <TableCell colSpan={6} className="py-3 px-5 sm:pl-14">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="bg-slate-50/70 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            Detailed Policy Balances for {emp.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {emp.policies.length} policies registered
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/40 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              <tr>
                                <th className="py-2 px-3">Policy / Leave Type</th>
                                <th className="py-2 px-3 text-right">Total Entitled</th>
                                <th className="py-2 px-3 text-right">Earned / Accrued</th>
                                <th className="py-2 px-3 text-right">Days Taken</th>
                                <th className="py-2 px-3 text-right">Pending</th>
                                <th className="py-2 px-3 text-right">Available Balance</th>
                                <th className="py-2 px-3 text-center w-36">Utilization</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {emp.policies.map((pol, pIdx) => {
                                const entitledNum = Number(pol.entitled) || 0;
                                const takenNum = Number(pol.taken) || 0;
                                const percent =
                                  entitledNum > 0
                                    ? Math.min(100, Math.round((takenNum / entitledNum) * 100))
                                    : 0;
                                return (
                                  <tr key={pIdx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-3 font-medium text-slate-800">
                                      {pol.leaveType}
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600 font-mono">
                                      {pol.entitled} d
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-600 font-mono">
                                      {pol.earned} d
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium text-slate-900 font-mono">
                                      {pol.taken} d
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono text-amber-600">
                                      {pol.pending > 0 ? `${pol.pending} d` : "—"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">
                                      {pol.available} d
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all ${
                                              percent >= 90
                                                ? "bg-rose-500"
                                                : percent >= 50
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                            }`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                                          {percent}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
