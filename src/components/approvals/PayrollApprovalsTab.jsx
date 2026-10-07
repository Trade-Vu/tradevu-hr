import React from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Banknote, CheckCircle2, ArrowRight, Clock, Users, ShieldAlert } from "lucide-react";

export default function PayrollApprovalsTab({
  payrollRuns = [],
  onApprove,
  isApproving = false,
  canApprove = true,
}) {
  const navigate = useNavigate();

  if (payrollRuns.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Payroll Runs Awaiting Approval</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          All submitted payroll runs have been approved or processed. You can review past cycles in the Payroll module.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/payroll')}
          className="mt-4 text-xs"
        >
          View Payroll History
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Pending Payroll Runs ({payrollRuns.length})
          </h3>
          <p className="text-xs text-slate-500">
            Review submitted compensation totals before releasing payments.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {payrollRuns.map((run) => {
          const runId = run._id || run.id;
          const monthFormatted = run.month
            ? format(new Date(run.month + "-01"), "MMMM yyyy")
            : "Unknown Month";

          return (
            <Card
              key={runId}
              className="border border-slate-200 shadow-sm bg-white overflow-hidden hover:border-slate-300 transition-colors"
            >
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-slate-900">
                          {monthFormatted}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Submitted
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {run.employeeCount || 0} Employees
                        </span>
                        <span>•</span>
                        <span>
                          Period:{" "}
                          {run.periodStart ? format(new Date(run.periodStart), "MMM d") : "—"}{" "}
                          - {run.periodEnd ? format(new Date(run.periodEnd), "MMM d, yyyy") : "—"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/payroll')}
                      className="text-xs h-8"
                    >
                      Inspect Run <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>

                    {canApprove ? (
                      <Button
                        size="sm"
                        disabled={isApproving}
                        onClick={() => onApprove(runId)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {isApproving ? "Approving..." : "Approve Payroll"}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-amber-700 bg-amber-50 border-amber-200">
                        <ShieldAlert className="w-3 h-3 mr-1" /> Requires Super or Finance Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                      Gross Amount
                    </span>
                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                      ₦{(run.totalGross || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                      Total Deductions
                    </span>
                    <span className="text-sm font-bold text-rose-600 mt-0.5 block">
                      ₦{(run.totalDeductions || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100/80">
                    <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
                      Net Disbursement
                    </span>
                    <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                      ₦{(run.totalNet || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                      Target Pay Date
                    </span>
                    <span className="text-sm font-semibold text-slate-700 mt-0.5 block">
                      {run.payDate ? format(new Date(run.payDate), "MMM d, yyyy") : "Standard"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
