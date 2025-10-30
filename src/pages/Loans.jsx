import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Plus, Clock, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function Loans() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    loan_type: 'standard',
    loan_amount: 0,
    loan_reason: '',
    duration_months: 12,
    paid_from: 'New Era LLC',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: loans = [] } = useQuery({
    queryKey: ['loans'],
    queryFn: () => base44.entities.Loan.list('-created_date'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const createLoanMutation = useMutation({
    mutationFn: (data) => {
      const employee = employees.find(e => e.id === data.employee_id);
      const monthlyInstallment = data.loan_amount / data.duration_months;
      const startMonth = new Date().toISOString().slice(0, 7);
      
      return base44.entities.Loan.create({
        ...data,
        organization_id: user.organization_id,
        employee_name: employee.full_name,
        monthly_installment: monthlyInstallment,
        start_month: startMonth,
        remaining_amount: data.loan_amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setShowForm(false);
      setFormData({
        employee_id: '',
        loan_type: 'standard',
        loan_amount: 0,
        loan_reason: '',
        duration_months: 12,
        paid_from: 'New Era LLC',
      });
    },
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Loan Management</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Employee Loans</h1>
            <p className="text-lg text-slate-600">Manage and track employee loan requests</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                New Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Loan Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createLoanMutation.mutate(formData); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name} - {emp.job_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loan Type</Label>
                    <Select value={formData.loan_type} onValueChange={(value) => setFormData(prev => ({ ...prev, loan_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Loan</SelectItem>
                        <SelectItem value="emergency">Emergency Loan</SelectItem>
                        <SelectItem value="advance">Salary Advance</SelectItem>
                        <SelectItem value="personal">Personal Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (SAR)</Label>
                    <Input type="number" value={formData.loan_amount} onChange={(e) => setFormData(prev => ({ ...prev, loan_amount: parseFloat(e.target.value) }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input type="number" value={formData.duration_months} onChange={(e) => setFormData(prev => ({ ...prev, duration_months: parseInt(e.target.value) }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Installment</Label>
                    <Input type="number" value={(formData.loan_amount / formData.duration_months).toFixed(2)} disabled className="bg-slate-50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={formData.loan_reason} onChange={(e) => setFormData(prev => ({ ...prev, loan_reason: e.target.value }))} rows={3} required />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={createLoanMutation.isPending}>
                    {createLoanMutation.isPending ? 'Creating...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map(loan => (
            <Card key={loan.id} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      SAR {loan.loan_amount.toLocaleString()}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">Loan Amount</p>
                  </div>
                  <Badge className={statusColors[loan.status]}>
                    {loan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-sm">
                      {loan.employee_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{loan.employee_name}</p>
                    <p className="text-xs text-slate-500">{loan.loan_reason}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Loan Type</p>
                      <p className="font-medium text-slate-900">{loan.loan_type.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="font-medium text-slate-900">SAR {loan.loan_amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Monthly Installment</p>
                      <p className="font-medium text-slate-900">SAR {loan.monthly_installment?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Loan Duration</p>
                      <p className="font-medium text-slate-900">{loan.duration_months} months</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">First Installment</p>
                      <p className="font-medium text-slate-900">{loan.start_month}</p>
                    </div>
                  </div>
                </div>

                {loan.paid_from && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500">To be paid from</p>
                    <p className="font-medium text-slate-900">{loan.paid_from}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {loans.length === 0 && (
            <Card className="col-span-full border-slate-200">
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No loans yet</h3>
                <p className="text-slate-500 mb-4">Create your first loan request</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Loan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}