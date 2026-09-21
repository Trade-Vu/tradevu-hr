import React, { useState } from "react";
import { payrollApi } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

export default function PayrollReports() {
  const [selectedRunId, setSelectedRunId] = useState("all");

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll Reports</h1>
            <p className="text-slate-600">Analyze organization-wide compensation metrics and generate the bank payment file.</p>
          </div>

          <div className="flex gap-3 items-center">
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
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Processed Gross</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">
                    {runs.filter(r => ['approved', 'paid', 'locked'].includes(r.status)).reduce((acc, r) => acc + (r.totalGross || 0), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Net Disbursed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">
                    {runs.filter(r => ['paid', 'locked'].includes(r.status)).reduce((acc, r) => acc + (r.totalNet || 0), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total Deductions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-rose-600">
                    {runs.filter(r => ['approved', 'paid', 'locked'].includes(r.status)).reduce((acc, r) => acc + (r.totalDeductions || 0), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payroll History Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Gross Pay</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map(run => (
                      <TableRow key={run._id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedRunId(run._id)}>
                        <TableCell className="font-medium">{format(new Date(run.month + '-01'), 'MMMM yyyy')}</TableCell>
                        <TableCell>{run.status}</TableCell>
                        <TableCell>{run.employeeCount || 0}</TableCell>
                        <TableCell className="text-right">{(run.totalGross || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-rose-600">{(run.totalDeductions || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-indigo-600">{(run.totalNet || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {runs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">No payroll runs found.</TableCell>
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