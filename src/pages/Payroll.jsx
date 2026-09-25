import React, { useState } from "react";
import { payrollApi } from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Plus, ArrowLeft, CheckCircle, FileText, Lock, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

const STATUS_STYLES = {
  draft: "bg-yellow-100 text-yellow-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  locked: "bg-slate-200 text-slate-700",
};

export default function Payroll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedRunId, setSelectedRunId] = useState(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [runForm, setRunForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    periodStart: '',
    periodEnd: '',
    cutoffDate: '',
    payDate: '',
  });

  const { data: payrollRuns = [], isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => listFrom(await payrollApi.getRuns()),
  });

  const { data: currentRun } = useQuery({
    queryKey: ['payroll-run', selectedRunId],
    queryFn: () => payrollApi.getRunById(selectedRunId),
    enabled: !!selectedRunId,
  });

  const { data: currentRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['payroll-run-records', selectedRunId],
    queryFn: async () => listFrom(await payrollApi.getRunRecords(selectedRunId)),
    enabled: !!selectedRunId,
  });

  const invalidateRuns = () => {
    queryClient.invalidateQueries(['payroll-runs']);
    queryClient.invalidateQueries(['payroll-run', selectedRunId]);
    queryClient.invalidateQueries(['payroll-run-records', selectedRunId]);
  };

  const createRunMutation = useMutation({
    mutationFn: (input) => payrollApi.createRun(input),
    onSuccess: () => {
      queryClient.invalidateQueries(['payroll-runs']);
      setShowRunDialog(false);
      setRunForm({ month: '', periodStart: '', periodEnd: '', cutoffDate: '', payDate: '' });
      toast.success("Payroll run generated successfully");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to generate payroll run"),
  });

  const submitRunMutation = useMutation({
    mutationFn: (id) => payrollApi.submitRun(id),
    onSuccess: () => { invalidateRuns(); toast.success("Payroll run submitted for approval"); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to submit payroll run"),
  });

  const approveRunMutation = useMutation({
    mutationFn: (id) => payrollApi.approveRun(id),
    onSuccess: () => { invalidateRuns(); toast.success("Payroll run approved"); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to approve payroll run"),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => payrollApi.markPaid(id),
    onSuccess: () => { invalidateRuns(); toast.success("Payroll run marked as paid"); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to mark payroll run as paid"),
  });

  const lockRunMutation = useMutation({
    mutationFn: (id) => payrollApi.lockRun(id),
    onSuccess: () => { invalidateRuns(); toast.success("Payroll run locked"); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to lock payroll run"),
  });

  const downloadPayslip = async (recordId, employeeName) => {
    try {
      const blob = await payrollApi.downloadPayslipPdf(recordId);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${employeeName || recordId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(`Failed to download payslip: ${error.message}`);
    }
  };

  const canApprove = ['SUPER_ADMIN', 'FINANCE_ADMIN'].includes(user?.role);
  const run = currentRun || payrollRuns.find(r => r._id === selectedRunId);

  if (selectedRunId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setSelectedRunId(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Runs
              </Button>

              <Badge variant="outline" className={STATUS_STYLES[run?.status] || 'bg-slate-100 text-slate-700'}>
                {run?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {run?.status === 'draft' && (
                <Button
                  onClick={() => submitRunMutation.mutate(run._id)}
                  disabled={submitRunMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {submitRunMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              )}
              {run?.status === 'submitted' && canApprove && (
                <Button
                  onClick={() => approveRunMutation.mutate(run._id)}
                  disabled={approveRunMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {approveRunMutation.isPending ? 'Approving...' : 'Approve Run'}
                </Button>
              )}
              {run?.status === 'approved' && canApprove && (
                <Button
                  onClick={() => markPaidMutation.mutate(run._id)}
                  disabled={markPaidMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {markPaidMutation.isPending ? 'Marking Paid...' : 'Mark as Paid'}
                </Button>
              )}
              {run?.status === 'paid' && canApprove && (
                <Button
                  onClick={() => lockRunMutation.mutate(run._id)}
                  disabled={lockRunMutation.isPending}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {lockRunMutation.isPending ? 'Locking...' : 'Lock Payroll'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Total Gross</p>
                <p className="text-2xl font-bold">{(run?.totalGross || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">{(run?.totalDeductions || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Total Net</p>
                <p className="text-2xl font-bold text-green-600">{(run?.totalNet || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-1">Employees Processed</p>
                <p className="text-2xl font-bold text-blue-600">{currentRecords.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions (incl. Tax)</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading records...</TableCell></TableRow>
                ) : (
                  currentRecords.map(record => {
                    const totalDeductions = (record.grossPay || 0) - (record.netPay || 0);
                    return (
                      <TableRow key={record._id}>
                        <TableCell className="font-medium">{record.employeeId?.fullName}</TableCell>
                        <TableCell>{(record.grossPay || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">{totalDeductions.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-bold">{(record.netPay || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadPayslip(record._id, record.employeeId?.fullName)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Payslip
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payroll</h1>
            <p className="text-slate-600">Generate and manage monthly payroll runs.</p>
          </div>

          <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white">
                <Plus className="w-4 h-4 mr-2" /> Generate Payroll Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll Run</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Month (YYYY-MM)</Label>
                  <Input type="month" value={runForm.month} onChange={e => setRunForm({...runForm, month: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Period Start Date</Label>
                  <Input type="date" value={runForm.periodStart} onChange={e => setRunForm({...runForm, periodStart: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Period End Date</Label>
                  <Input type="date" value={runForm.periodEnd} onChange={e => setRunForm({...runForm, periodEnd: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cutoff Date (optional)</Label>
                  <Input type="date" value={runForm.cutoffDate} onChange={e => setRunForm({...runForm, cutoffDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Pay Date (optional)</Label>
                  <Input type="date" value={runForm.payDate} onChange={e => setRunForm({...runForm, payDate: e.target.value})} />
                </div>
                <Button
                  onClick={() => createRunMutation.mutate({
                    month: runForm.month,
                    periodStart: runForm.periodStart,
                    periodEnd: runForm.periodEnd,
                    ...(runForm.cutoffDate ? { cutoffDate: runForm.cutoffDate } : {}),
                    ...(runForm.payDate ? { payDate: runForm.payDate } : {}),
                  })}
                  disabled={createRunMutation.isPending || !runForm.month || !runForm.periodStart || !runForm.periodEnd}
                  className="w-full bg-slate-900"
                >
                  {createRunMutation.isPending ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Gross</TableHead>
                <TableHead>Total Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading runs...</TableCell></TableRow>
              ) : payrollRuns.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No payroll runs generated yet.</TableCell></TableRow>
              ) : (
                payrollRuns.map(r => (
                  <TableRow key={r._id}>
                    <TableCell className="font-semibold">{r.month}</TableCell>
                    <TableCell>{format(new Date(r.periodStart), 'MMM d, yyyy')} - {format(new Date(r.periodEnd), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{(r.totalGross || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-green-600 font-medium">{(r.totalNet || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-700'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRunId(r._id)}>
                        View Records
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}