import React from "react";
import { format } from "date-fns";
import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLeaveStatus, getLeaveStatusBadgeClass } from "@/lib/leaveStatus";

// Cycled per leave type so the tab keeps its original two-tone block look no matter how
// many leave types the org has configured, instead of hardcoding just Annual/Sick.
const BALANCE_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-green-50", text: "text-green-700" },
  { bg: "bg-purple-50", text: "text-purple-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-700" },
  { bg: "bg-cyan-50", text: "text-cyan-700" },
];

export default function LeaveTab({ balances, leaveTypes, requests, onOpenLeave }) {
  const balanceRows = balances.length > 0
    ? balances.map((balance) => ({
        key: balance.id || balance.leaveTypeId,
        name: leaveTypes.find((type) => type.id === balance.leaveTypeId)?.name || balance.leaveType || "Leave",
        total: balance.totalEntitled || 0,
        used: balance.used || 0,
        remaining: balance.available || 0,
      }))
    : leaveTypes.map((type) => ({ key: type.id, name: type.name, total: 0, used: 0, remaining: 0 }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card
        className="overflow-hidden transition-colors shadow-sm cursor-pointer border-slate-200/60 bg-white/70 backdrop-blur-md rounded-2xl hover:border-indigo-300"
        onClick={onOpenLeave}
      >
        <CardHeader className="border-b border-slate-200">
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {balanceRows.length === 0 ? (
            <p className="text-sm text-center text-slate-500">No leave types configured</p>
          ) : (
            <div className="space-y-4">
              {balanceRows.map((row, index) => {
                const color = BALANCE_COLORS[index % BALANCE_COLORS.length];
                return (
                  <div key={row.key} className={`p-4 rounded-lg ${color.bg}`}>
                    <p className="text-sm text-slate-600">{row.name}</p>
                    <p className={`text-3xl font-bold ${color.text}`}>{row.remaining}</p>
                    <p className="text-xs text-slate-500">
                      {row.used} used of {row.total}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card
        className="overflow-hidden transition-colors shadow-sm cursor-pointer border-slate-200/60 bg-white/70 backdrop-blur-md rounded-2xl hover:border-indigo-300"
        onClick={onOpenLeave}
      >
        <CardHeader className="border-b border-slate-200">
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {requests.length === 0 ? (
            <div className="py-8 text-center">
              <Plane className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No leave requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((leave) => (
                <div key={leave.id} className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {leave.leave_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(leave.start_date), "MMM d")} -{" "}
                        {format(new Date(leave.end_date), "MMM d")}
                      </p>
                    </div>
                    <Badge className={getLeaveStatusBadgeClass(leave.status)}>
                      {formatLeaveStatus(leave.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
