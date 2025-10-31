
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Calendar, Plus, Download, Search, Edit } from "lucide-react";
import { format } from "date-fns";

export default function Payroll() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null); // State to hold the payroll being edited
  const [user, setUser] = useState(null); // State to hold the current user for audit logs
  const [formData, setFormData] = useState({
    employee_id: '',
    month: new Date().toISOString().slice(0, 7),
    basic_salary: 0,
    allowances: { housing: 0, transport: 0, food: 0, other: 0 },
    deductions: { late_days: 0, absent_days: 0, unpaid_leave_days: 0, loans: 0, insurance: 0, other: 0 },
    overtime_hours: 0,
  });

  // Load current user for audit logging
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user for audit logging:", error);
      }
    };
    loadUser();
  }, []);

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => base44.entities.Payroll.list('-month'),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  // Utility function for creating audit logs
  const createAuditLog = async (action, entityId, entityName, changes = {}) => {
    if (!user) {
      console.warn("User not loaded, skipping audit log creation.");
      return;
    }
    try {
      await base44.entities.AuditLog.create({
        organization_id: user.organization_id,
        user_email: user.email,
        user_name: user.full_name,
        action,
        entity_type: 'Payroll',
        entity_id: entityId,
        entity_name,
        changes,
        description: `${action} payroll for ${entityName}`,
        status: 'success',
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  };

  const createPayrollMutation = useMutation({
    mutationFn: async (data) => {
      const employee = employees.find(e => e.id === data.employee_id);
      
      const totalAllowances = Object.values(data.allowances).reduce((sum, val) => sum + (val || 0), 0);
      const totalDeductions = Object.values(data.deductions).reduce((sum, val) => sum + (val || 0), 0);
      const overtimeAmount = data.overtime_hours * 50; // SAR 50 per hour
      const totalEarnings = data.basic_salary + totalAllowances + overtimeAmount;
      const netSalary = totalEarnings - totalDeductions;

      const payroll = await base44.entities.Payroll.create({
        ...data,
        employee_name: employee.full_name,
        total_earnings: totalEarnings,
        total_deductions: totalDeductions,
        overtime_amount: overtimeAmount,
        net_salary: netSalary,
        status: 'draft',
      });

      await createAuditLog('create', payroll.id, employee.full_name, {
        after: payroll
      });

      return payroll;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setShowAddDialog(false);
      setFormData({
        employee_id: '',
        month: new Date().toISOString().slice(0, 7),
        basic_salary: 0,
        allowances: { housing: 0, transport: 0, food: 0, other: 0 },
        deductions: { late_days: 0, absent_days: 0, unpaid_leave_days: 0, loans: 0, insurance: 0, other: 0 },
        overtime_hours: 0,
      });
    },
  });

  const updatePayrollMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const employee = employees.find(e => e.id === data.employee_id); // Get employee for updated name if employee_id changed

      const totalAllowances = Object.values(data.allowances).reduce((sum, val) => sum + (val || 0), 0);
      const totalDeductions = Object.values(data.deductions).reduce((sum, val) => sum + (val || 0), 0);
      const overtimeAmount = data.overtime_hours * 50;
      const totalEarnings = data.basic_salary + totalAllowances + overtimeAmount;
      const netSalary = totalEarnings - totalDeductions;

      const updatedPayload = {
        ...data,
        employee_name: employee?.full_name || oldData.employee_name, // Use updated employee name or fallback
        total_earnings: totalEarnings,
        total_deductions: totalDeductions,
        overtime_amount: overtimeAmount,
        net_salary: netSalary,
      };

      const updated = await base44.entities.Payroll.update(id, updatedPayload);

      await createAuditLog('update', id, updatedPayload.employee_name, {
        before: oldData,
        after: updated,
        fields_changed: Object.keys(data) // Note: this tracks changes in formData, not actual diff
      });

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setEditingPayroll(null);
      setShowAddDialog(false); // Close dialog after successful update
    },
  });

  // Function to handle editing a payroll record
  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employee_id: payroll.employee_id,
      month: payroll.month,
      basic_salary: payroll.basic_salary || 0,
      allowances: payroll.allowances ? { housing: 0, transport: 0, food: 0, other: 0, ...payroll.allowances } : { housing: 0, transport: 0, food: 0, other: 0 },
      deductions: payroll.deductions ? { late_days: 0, absent_days: 0, unpaid_leave_days: 0, loans: 0, insurance: 0, other: 0, ...payroll.deductions } : { late_days: 0, absent_days: 0, unpaid_leave_days: 0, loans: 0, insurance: 0, other: 0 },
      overtime_hours: payroll.overtime_hours || 0,
    });
    setShowAddDialog(true);
  };

  const currentMonthPayrolls = payrolls.filter(p => p.month === monthFilter);
  const totalPayroll = currentMonthPayrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);
  const approvedCount = currentMonthPayrolls.filter(p => p.status === 'approved' || p.status === 'paid').length;

  // Filter payrolls by search term as well
  const filteredPayrolls = currentMonthPayrolls.filter(payroll =>
    payroll.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-4">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Payroll Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Payroll
            </h1>
            <p className="text-lg text-slate-600">
              Automated salary processing and management
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) { // When dialog is closing
                setEditingPayroll(null); // Clear editing state
                setFormData({ // Reset form to initial add state
                  employee_id: '',
                  month: new Date().toISOString().slice(0, 7),
                  basic_salary: 0,
                  allowances: { housing: 0, transport: 0, food: 0, other: 0 },
                  deductions: { late_days: 0, absent_days: 0, unpaid_leave_days: 0, loans: 0, insurance: 0, other: 0 },
                  overtime_hours: 0,
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPayroll ? 'Edit' : 'Add'} Payroll Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (editingPayroll) {
                    updatePayrollMutation.mutate({ id: editingPayroll.id, data: formData, oldData: editingPayroll });
                  } else {
                    createPayrollMutation.mutate(formData); 
                  }
                }} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee *</Label>
                      <Select value={formData.employee_id} onValueChange={(value) => {
                        const emp = employees.find(e => e.id === value);
                        setFormData(prev => ({ 
                          ...prev, 
                          employee_id: value,
                          basic_salary: emp?.payroll_details?.basic_salary || 0,
                          allowances: emp?.payroll_details?.allowances || { housing: 0, transport: 0, food: 0, other: 0 }
                        }));
                      }} disabled={!!editingPayroll}> {/* Disable employee selection when editing */}
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
                    <div className="space-y-2">
                      <Label>Month *</Label>
                      <Input 
                        type="month" 
                        value={formData.month}
                        onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Basic Salary</Label>
                      <Input 
                        type="number" 
                        value={formData.basic_salary}
                        onChange={(e) => setFormData(prev => ({ ...prev, basic_salary: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Overtime Hours</Label>
                      <Input 
                        type="number" 
                        value={formData.overtime_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, overtime_hours: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Allowances</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Housing" type="number" value={formData.allowances.housing} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, housing: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Transport" type="number" value={formData.allowances.transport} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, transport: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Food" type="number" value={formData.allowances.food} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, food: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Other" type="number" value={formData.allowances.other} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, other: parseFloat(e.target.value) || 0 }}))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deductions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Late Days" type="number" value={formData.deductions.late_days} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, late_days: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Absent Days" type="number" value={formData.deductions.absent_days} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, absent_days: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Unpaid Leave" type="number" value={formData.deductions.unpaid_leave_days} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, unpaid_leave_days: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Loans" type="number" value={formData.deductions.loans} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, loans: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Insurance" type="number" value={formData.deductions.insurance} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, insurance: parseFloat(e.target.value) || 0 }}))} />
                      <Input placeholder="Other" type="number" value={formData.deductions.other} onChange={(e) => setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, other: parseFloat(e.target.value) || 0 }}))} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPayrollMutation.isPending || updatePayrollMutation.isPending || !formData.employee_id}>
                      {(createPayrollMutation.isPending || updatePayrollMutation.isPending) ? 'Saving...' : editingPayroll ? 'Update Payroll' : 'Create Payroll'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-green-100 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {totalPayroll.toLocaleString()} SAR
              </div>
              <div className="text-sm text-slate-600">Total This Month</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {currentMonthPayrolls.length}
              </div>
              <div className="text-sm text-slate-600">Employees</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {approvedCount}
              </div>
              <div className="text-sm text-slate-600">Approved</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {monthFilter}
              </div>
              <div className="text-sm text-slate-600">Current Period</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payroll List */}
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Payroll Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No payroll records</h3>
                <p className="text-slate-500 mb-4">Add payroll for this month to get started</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payroll
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPayrolls.map((payroll) => (
                  <div key={payroll.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{payroll.employee_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Basic: {payroll.basic_salary.toLocaleString()} SAR</span>
                          <span>Net: {payroll.net_salary.toLocaleString()} SAR</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={
                          payroll.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                          payroll.status === 'approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }>
                          {payroll.status}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(payroll)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
