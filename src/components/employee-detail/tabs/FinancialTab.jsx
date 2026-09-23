import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "../employeeDetailUtils";

export default function FinancialTab({
  employee,
  isEditing,
  editData,
  setEditData,
  user,
  salaryHistory = [],
  onRequestCompensationUpdate,
  isRequestingComp,
}) {
  const [showCompDialog, setShowCompDialog] = useState(false);
  const [compForm, setCompForm] = useState({ basicSalary: '', housing: '', transport: '', reason: '' });

  const handleCompSubmit = () => {
    onRequestCompensationUpdate(compForm, () => {
      setShowCompDialog(false);
      setCompForm({ basicSalary: '', housing: '', transport: '', reason: '' });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Financial & Banking Details</h3>
        {!isEditing && ['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
          <Button onClick={() => setShowCompDialog(true)} className="text-white bg-slate-900 hover:bg-slate-800">
            Request Compensation Update
          </Button>
        )}
      </div>

      <Dialog open={showCompDialog} onOpenChange={setShowCompDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Compensation Update</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Basic Salary (NGN)</Label>
              <Input
                type="number"
                value={compForm.basicSalary}
                onChange={(e) => setCompForm({ ...compForm, basicSalary: e.target.value })}
                placeholder="e.g. 500000"
              />
            </div>
            <div className="space-y-2">
              <Label>Housing Allowance</Label>
              <Input type="number" value={compForm.housing} onChange={(e) => setCompForm({ ...compForm, housing: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Transport Allowance</Label>
              <Input type="number" value={compForm.transport} onChange={(e) => setCompForm({ ...compForm, transport: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reason for Update</Label>
              <Input
                value={compForm.reason}
                onChange={(e) => setCompForm({ ...compForm, reason: e.target.value })}
                placeholder="e.g. Annual Review, Promotion"
              />
            </div>
            <Button
              onClick={handleCompSubmit}
              disabled={isRequestingComp || !compForm.basicSalary || !compForm.reason}
              className="w-full text-white bg-slate-900"
            >
              {isRequestingComp ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isEditing ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input
              value={editData.payroll_details?.bank_name || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                payroll_details: { ...prev.payroll_details, bank_name: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>IBAN / Account Number</Label>
            <Input
              value={editData.payroll_details?.iban || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                payroll_details: { ...prev.payroll_details, iban: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>GOSI / Pension Number</Label>
            <Input
              value={editData.payroll_details?.gosi_number || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                payroll_details: { ...prev.payroll_details, gosi_number: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Pay Grade</Label>
            <Input
              value={editData.payroll_details?.pay_grade || ''}
              onChange={(e) => setEditData(prev => ({
                ...prev,
                payroll_details: { ...prev.payroll_details, pay_grade: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Pension Administrator</Label>
            <Input
              value={editData.pensionAdministrator || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, pensionAdministrator: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>HMO Plan</Label>
            <Select value={editData.hmoPlan || ''} onValueChange={(val) => setEditData(prev => ({ ...prev, hmoPlan: val }))}>
              <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>HMO Provider</Label>
            <Input
              value={editData.hmoProvider || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, hmoProvider: e.target.value }))}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-green-50">
              <p className="mb-1 text-sm text-slate-600">Basic Salary</p>
              <p className="text-2xl font-bold text-green-700">
                {employee.payroll_details?.basic_salary?.toLocaleString() || 0} NGN
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50">
              <p className="mb-1 text-sm text-slate-600">Total Compensation</p>
              <p className="text-2xl font-bold text-blue-700">
                {((employee.payroll_details?.basic_salary || 0) +
                  (employee.allowances || []).reduce((sum, a) => sum + (
                    a.mode === 'percentage'
                      ? ((employee.payroll_details?.basic_salary || 0) * (Number(a.value) || 0)) / 100
                      : (Number(a.value) || 0)
                  ), 0)
                ).toLocaleString()} NGN
              </p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-slate-900">Allowances</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {(employee.allowances || []).length === 0 ? (
                <p className="text-sm text-slate-500">No allowances currently set.</p>
              ) : (
                employee.allowances.map((a, idx) => (
                  <div key={idx} className="flex justify-between p-3 rounded-lg bg-slate-50">
                    <span className="capitalize text-slate-600">
                      {a.type?.replace(/_/g, ' ')} {a.taxable ? '' : '(non-taxable)'}
                    </span>
                    <span className="font-medium">
                      {a.mode === 'percentage' ? `${a.value}%` : `${Number(a.value).toLocaleString()} NGN`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-slate-900">Banking Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">Bank Name</span>
                <span className="font-medium">{employee.payroll_details?.bank_name || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">Account Number</span>
                <span className="font-mono font-medium">{employee.payroll_details?.iban || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">Pension / Tax ID</span>
                <span className="font-medium">{employee.payroll_details?.gosi_number || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">Pay Grade</span>
                <span className="font-medium">{employee.payroll_details?.pay_grade || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">Pension Administrator</span>
                <span className="font-medium">{employee.pensionAdministrator || 'Not set'}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="mb-3 font-semibold text-slate-900">Health Insurance (HMO)</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">HMO Plan</span>
                <span className="font-medium">{employee.hmoPlan || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-slate-600">HMO Provider</span>
                <span className="font-medium">{employee.hmoProvider || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="mb-3 font-semibold text-slate-900">Salary History</h4>
            <div className="overflow-hidden bg-white border rounded-lg border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-4 text-center text-slate-500">No salary history recorded.</TableCell>
                    </TableRow>
                  ) : (
                    salaryHistory.map(history => {
                      const allowanceTotal = (history.allowances || []).reduce((sum, a) => sum + (
                        a.mode === 'percentage'
                          ? ((history.basicSalary || 0) * (Number(a.value) || 0)) / 100
                          : (Number(a.value) || 0)
                      ), 0);
                      return (
                        <TableRow key={history._id}>
                          <TableCell>{format(new Date(history.effectiveDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{(history.basicSalary || 0).toLocaleString()} NGN</TableCell>
                          <TableCell>{allowanceTotal > 0 ? `${allowanceTotal.toLocaleString()} NGN` : '-'}</TableCell>
                          <TableCell>{history.reason}</TableCell>
                          <TableCell>{history.approvedBy?.fullName || '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
