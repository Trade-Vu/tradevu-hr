import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatLeaveStatus, getLeaveStatusBadgeClass } from "@/lib/leaveStatus";

export default function LeaveReportRawTable({
  headers = [],
  rows = [],
  reportType = "summary",
  isItemized = false,
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/90">
          <TableRow className="border-b border-slate-200 hover:bg-transparent">
            {headers.map((h, i) => (
              <TableHead key={i} className="text-[11px] font-semibold text-slate-700 whitespace-nowrap py-2.5">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, rIdx) => (
            <TableRow key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/60">
              {r.map((cell, cIdx) => (
                <TableCell key={cIdx} className="text-xs text-slate-700 whitespace-nowrap py-2.5">
                  {isItemized && cIdx === 5 ? (
                    <Badge className={`text-[10px] uppercase font-semibold ${getLeaveStatusBadgeClass(cell)}`}>
                      {formatLeaveStatus(cell)}
                    </Badge>
                  ) : reportType === "planning" && cIdx === 7 ? (
                    <Badge className={`text-[10px] uppercase font-semibold ${getLeaveStatusBadgeClass(cell)}`}>
                      {formatLeaveStatus(cell)}
                    </Badge>
                  ) : reportType === "summary" && cIdx === 6 ? (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        cell === "Confirmed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {cell}
                    </span>
                  ) : reportType === "summary" && cIdx === 13 ? (
                    <span className="font-semibold text-emerald-700">{cell}</span>
                  ) : (
                    String(cell ?? "")
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
