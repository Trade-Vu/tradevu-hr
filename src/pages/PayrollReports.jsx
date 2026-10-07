import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { payrollApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

const STATUS_BADGES = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-indigo-50 text-indigo-700 border-indigo-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  locked: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function PayrollReports() {
  const navigate = useNavigate();
  const [selectedRunId, setSelectedRunId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: runs = [] } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => listFrom(await payrollApi.getRuns()),
  });

  const { data: records = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['payroll-run-records', selectedRunId],
    queryFn: async () => listFrom(await payrollApi.getRunRecords(selectedRunId)),
    enabled: selectedRunId !== "all",
  });

  const { data: departmentSummary = [] } = useQuery({
    queryKey: ['payroll-department-summary', selectedRunId],
    queryFn: () => payrollApi.getDepartmentReport(selectedRunId),
    enabled: selectedRunId !== "all",
  });

  const handleExportBankFile = async () => {
    if (selectedRunId === "all") {
      toast.error("Please select a specific payroll run to export");
      return;
    }
    try {
      const run = runs.find(r => r._id === selectedRunId);
      const blob = await payrollApi.downloadBankFile(selectedRunId);
      const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment_instructions_${run?.month || selectedRunId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(`Failed to export bank file: ${error.message}`);
    }
  };

  const selectedRun = runs.find(r => r._id === selectedRunId);

  // Overview metrics calculations
  const totalDisbursedNet = runs
    .filter(r => ['paid', 'locked'].includes(r.status))
    .reduce((acc, r) => acc + (r.totalNet || 0), 0);

  const pendingRuns = runs.filter(r => r.status === 'submitted');
  const totalPendingNet = pendingRuns.reduce((acc, r) => acc + (r.totalNet || 0), 0);

  const totalProcessedGross = runs.reduce((acc, r) => acc + (r.totalGross || 0), 0);
  const totalDeductions = runs.reduce((acc, r) => acc + (r.totalDeductions || 0), 0);

  const filteredRuns = statusFilter === "all"
    ? runs
    : runs.filter(r => r.status === statusFilter);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll Reports</h1>
            <p className="text-slate-600">Analyze organization-wide compensation metrics and generate the bank payment file.</p>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <Select value={selectedRunId} onValueChange={setSelectedRunId}>
              <SelectTrigger className="w-[220px] bg-white">
                <SelectValue placeholder="Select Payroll Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Overview</SelectItem>
                {runs.map(run => (
                  <SelectItem key={run._id} value={run._id}>
                    {format(new Date(run.month + '-01'), 'MMMM yyyy')} ({run.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportBankFile} disabled={selectedRunId === "all"} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Bank File
            </Button>
          </div>
        </div>

        {selectedRunId === "all" ? (
          <div className="space-y-6">
            {/* Informational Alert if runs are awaiting approval */}
            {pendingRuns.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 shadow-sm">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">
                      {pendingRuns.length} Payroll Run(s) Awaiting Approval
                    </h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      You have ₦{totalPendingNet.toLocaleString()} in submitted payroll runs awaiting review. Approve and disburse them to reflect in Disbursed Metrics.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/pendingapprovals')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs shrink-0 shadow-sm"
                >
                  Go to Approvals <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Net Disbursed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">
                    ₦{totalDisbursedNet.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Finalized &amp; paid runs
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pending Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    ₦{totalPendingNet.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-blue-600" />
                    {pendingRuns.length} run(s) submitted
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Processed Gross
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    ₦{totalProcessedGross.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cumulative gross pay volume
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">
                    ₦{totalDeductions.toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Taxes &amp; statutory withholdings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payroll History Table */}
            <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Payroll History Overview</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Click any month row to drill into employee-level registers and department breakdown.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter status:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 text-xs bg-slate-50">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                      <TableHead className="font-semibold text-xs text-slate-700">Month</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-center">Employees</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Gross Pay</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Deductions</TableHead>
                      <TableHead className="font-semibold text-xs text-slate-700 text-right">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRuns.map(run => (
                      <TableRow key={run._id} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedRunId(run._id)}>
                        <TableCell className="font-medium text-slate-900 text-xs">
                          {format(new Date(run.month + '-01'), 'MMMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`capitalize text-xs font-medium ${STATUS_BADGES[run.status] || 'bg-slate-100 text-slate-700'}`}>
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-600 font-medium">
                          {run.employeeCount || 0}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium text-slate-800">
                          ₦{(run.totalGross || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs text-rose-600 font-medium">
                          ₦{(run.totalDeductions || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-indigo-700">
                          ₦{(run.totalNet || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRuns.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-10 text-xs">
                          No payroll runs found matching current filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedRun && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="bg-indigo-50 border-indigo-100">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-indigo-600 mb-1">Total Net Pay</p>
                    <p className="text-2xl font-bold text-indigo-900">{(selectedRun.totalNet || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Gross</p>
                    <p className="text-2xl font-bold text-slate-900">{(selectedRun.totalGross || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Deductions</p>
                    <p className="text-2xl font-bold text-rose-600">{(selectedRun.totalDeductions || 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-600 mb-1">Employees Paid</p>
                    <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {departmentSummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Department-Wise Payroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Gross Pay</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentSummary.map((dept, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{dept.departmentName}</TableCell>
                          <TableCell className="text-right">{dept.employeeCount}</TableCell>
                          <TableCell className="text-right">{(dept.grossPay || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-rose-600">{(dept.deductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-indigo-600">{(dept.netPay || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Payroll Register</CardTitle>
                <CardDescription>Line item view for each employee in this run.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRecords ? (
                  <div className="py-8 text-center text-slate-500">Loading records...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Basic</TableHead>
                        <TableHead className="text-right">Allowances</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Deductions</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map(record => {
                        const totalAllowances = Object.values(record.allowances || {}).reduce((a, b) => Number(a) + Number(b), 0);
                        const totalDeductions = (record.grossPay || 0) - (record.netPay || 0);
                        return (
                          <TableRow key={record._id}>
                            <TableCell>
                              <p className="font-medium">{record.employeeId?.fullName}</p>
                              <p className="text-xs text-slate-500">{record.employeeId?.employeeCode}</p>
                            </TableCell>
                            <TableCell>{record.employeeId?.departmentId?.name || '-'}</TableCell>
                            <TableCell className="text-right">{(record.basicSalary || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-emerald-600">+{totalAllowances.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">{(record.grossPay || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-rose-600">{(record.taxAmount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-rose-600">-{totalDeductions.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-bold text-indigo-600">{(record.netPay || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}