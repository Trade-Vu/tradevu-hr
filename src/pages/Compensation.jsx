import React, { useState } from "react";
import { compensationApi, employeesApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Settings2, Users, Trash2 } from "lucide-react";

const listFrom = (response) => (Array.isArray(response) ? response : response?.data || []);

const ALLOWANCE_TYPES = ['basic', 'housing', 'transport', 'meal', 'utility', 'entertainment', 'thirteenth_month', 'other'];
const ALLOWANCE_MODES = ['fixed', 'percentage'];

const emptyAllowance = () => ({ type: 'housing', mode: 'fixed', value: 0, taxable: true });

const emptyStructureForm = () => ({
  name: '',
  departmentId: '',
  payGrade: '',
  effectiveDate: new Date().toISOString().slice(0, 10),
  basicSalary: '',
  allowances: [],
  status: 'DRAFT',
});

export default function Compensation() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("structures");
  const [showStructureDialog, setShowStructureDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const [structureForm, setStructureForm] = useState(emptyStructureForm());
  const [assignForm, setAssignForm] = useState({ structureId: '', reason: '', overrideBasicSalary: '' });

  const { data: departments = [] } = useDepartments();

  const { data: structures = [], isLoading: structuresLoading } = useQuery({
    queryKey: ['compensation-structures'],
    queryFn: async () => listFrom(await compensationApi.getStructures()),
  });

  const activeStructures = structures.filter(s => s.status === 'ACTIVE');

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees-basic'],
    queryFn: async () => listFrom(await employeesApi.getEmployees()),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['compensation-assignments'],
    queryFn: async () => listFrom(await compensationApi.getAssignments()),
  });

  const assignmentByEmployeeId = assignments.reduce((acc, a) => {
    const empId = a.employeeId?._id || a.employeeId;
    if (empId) acc[empId] = a;
    return acc;
  }, {});

  const createStructureMutation = useMutation({
    mutationFn: (input) => compensationApi.createStructure({
      name: input.name,
      departmentId: input.departmentId || undefined,
      payGrade: input.payGrade || undefined,
      effectiveDate: input.effectiveDate,
      components: {
        basicSalary: Number(input.basicSalary) || 0,
        allowances: input.allowances,
      },
      status: input.status,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['compensation-structures']);
      setShowStructureDialog(false);
      setStructureForm(emptyStructureForm());
      toast.success("Compensation structure created");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create structure"),
  });

  const assignMutation = useMutation({
    mutationFn: (input) => compensationApi.assign({
      employeeId: assignTarget.id,
      structureId: input.structureId,
      reason: input.reason || undefined,
      overrides: input.overrideBasicSalary !== '' ? { basicSalary: Number(input.overrideBasicSalary) } : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['compensation-assignments']);
      queryClient.invalidateQueries(['employee']);
      setShowAssignDialog(false);
      setAssignTarget(null);
      setAssignForm({ structureId: '', reason: '', overrideBasicSalary: '' });
      toast.success("Compensation structure assigned");
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to assign structure"),
  });

  const addAllowanceRow = () => {
    setStructureForm(prev => ({ ...prev, allowances: [...prev.allowances, emptyAllowance()] }));
  };

  const updateAllowanceRow = (index, field, value) => {
    setStructureForm(prev => ({
      ...prev,
      allowances: prev.allowances.map((a, i) => i === index ? { ...a, [field]: value } : a),
    }));
  };

  const removeAllowanceRow = (index) => {
    setStructureForm(prev => ({ ...prev, allowances: prev.allowances.filter((_, i) => i !== index) }));
  };

  const openAssignDialog = (employee) => {
    setAssignTarget(employee);
    setAssignForm({ structureId: '', reason: '', overrideBasicSalary: '' });
    setShowAssignDialog(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Compensation Management</h1>
            <p className="text-slate-600">Define salary structures and assign them to employees.</p>
          </div>

          <Dialog open={showStructureDialog} onOpenChange={(open) => { setShowStructureDialog(open); if (!open) setStructureForm(emptyStructureForm()); }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 text-white">
                <Plus className="w-4 h-4 mr-2" /> New Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Compensation Structure</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Structure Name</Label>
                  <Input value={structureForm.name} onChange={e => setStructureForm({ ...structureForm, name: e.target.value })} placeholder="e.g. Senior Engineering Band" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department (optional)</Label>
                    <Select value={structureForm.departmentId || "none"} onValueChange={v => setStructureForm({ ...structureForm, departmentId: v === "none" ? '' : v })}>
                      <SelectTrigger><SelectValue placeholder="Any department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any department</SelectItem>
                        {departments.map(d => (
                          <SelectItem key={d._id || d.id} value={d._id || d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pay Grade (optional)</Label>
                    <Input value={structureForm.payGrade} onChange={e => setStructureForm({ ...structureForm, payGrade: e.target.value })} placeholder="e.g. L4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Effective Date</Label>
                  <Input type="date" value={structureForm.effectiveDate} onChange={e => setStructureForm({ ...structureForm, effectiveDate: e.target.value })} />
                </div>

                <h3 className="font-semibold text-slate-800 mt-4 border-b pb-2">Basic Salary</h3>
                <div className="space-y-2">
                  <Label>Monthly Basic Salary</Label>
                  <Input type="number" value={structureForm.basicSalary} onChange={e => setStructureForm({ ...structureForm, basicSalary: e.target.value })} />
                </div>

                <div className="flex items-center justify-between mt-4 border-b pb-2">
                  <h3 className="font-semibold text-slate-800">Allowances</h3>
                  <Button type="button" size="sm" variant="outline" onClick={addAllowanceRow}>
                    <Plus className="w-4 h-4 mr-1" /> Add Allowance
                  </Button>
                </div>
                {structureForm.allowances.length === 0 ? (
                  <p className="text-sm text-slate-500">No allowances added.</p>
                ) : (
                  <div className="space-y-3">
                    {structureForm.allowances.map((a, idx) => (
                      <div key={idx} className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] gap-2 items-center">
                        <Select value={a.type} onValueChange={v => updateAllowanceRow(idx, 'type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALLOWANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={a.mode} onValueChange={v => updateAllowanceRow(idx, 'mode', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALLOWANCE_MODES.map(m => <SelectItem key={m} value={m}>{m === 'fixed' ? 'Fixed' : '% of basic'}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" value={a.value} onChange={e => updateAllowanceRow(idx, 'value', Number(e.target.value) || 0)} />
                        <div className="flex items-center gap-1.5" title="Taxable">
                          <Checkbox checked={a.taxable} onCheckedChange={c => updateAllowanceRow(idx, 'taxable', !!c)} />
                          <span className="text-xs text-slate-500">Taxable</span>
                        </div>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeAllowanceRow(idx)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <Label>Status</Label>
                  <Select value={structureForm.status} onValueChange={v => setStructureForm({ ...structureForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Only Active structures can be assigned to employees.</p>
                </div>

                <Button
                  onClick={() => createStructureMutation.mutate(structureForm)}
                  disabled={createStructureMutation.isPending || !structureForm.name || !structureForm.basicSalary}
                  className="w-full mt-4 bg-slate-900"
                >
                  {createStructureMutation.isPending ? 'Saving...' : 'Save Structure'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border w-full justify-start h-12 rounded-lg p-1">
            <TabsTrigger value="structures" className="data-[state=active]:bg-slate-100 rounded-md px-6">
              <Settings2 className="w-4 h-4 mr-2" />
              Structures
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-100 rounded-md px-6">
              <Users className="w-4 h-4 mr-2" />
              Employee Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structures">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pay Grade</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structuresLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : structures.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">No structures found.</TableCell></TableRow>
                  ) : (
                    structures.map(struct => {
                      const totalAllowances = (struct.components?.allowances || []).reduce((sum, a) => sum + (
                        a.mode === 'percentage' ? (struct.components.basicSalary * (Number(a.value) || 0)) / 100 : (Number(a.value) || 0)
                      ), 0);
                      return (
                        <TableRow key={struct._id}>
                          <TableCell className="font-semibold">{struct.name}</TableCell>
                          <TableCell>{struct.payGrade || '-'}</TableCell>
                          <TableCell>{format(new Date(struct.effectiveDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-green-600 font-medium">{(struct.components?.basicSalary || 0).toLocaleString()}</TableCell>
                          <TableCell>{totalAllowances.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              struct.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                                struct.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' : 'bg-yellow-50 text-yellow-700'
                            }>{struct.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Current Structure</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeesLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : (
                    employees.map(emp => {
                      const assignment = assignmentByEmployeeId[emp._id];
                      return (
                        <TableRow key={emp._id}>
                          <TableCell className="font-medium">
                            <div>{emp.fullName}</div>
                            <div className="text-xs text-slate-500">{emp.employeeCode}</div>
                          </TableCell>
                          <TableCell>{emp.departmentId?.name || 'N/A'}</TableCell>
                          <TableCell>{emp.jobTitle}</TableCell>
                          <TableCell>
                            {assignment?.compensationStructureId?.name ? (
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700">{assignment.compensationStructureId.name}</Badge>
                            ) : (
                              <span className="text-sm text-slate-400">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openAssignDialog(emp)}>Assign Structure</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Compensation Structure {assignTarget ? `to ${assignTarget.fullName}` : ''}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Structure</Label>
                <Select value={assignForm.structureId} onValueChange={v => setAssignForm({ ...assignForm, structureId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select an active structure" /></SelectTrigger>
                  <SelectContent>
                    {activeStructures.map(s => (
                      <SelectItem key={s._id} value={s._id}>{s.name}{s.payGrade ? ` (${s.payGrade})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeStructures.length === 0 && (
                  <p className="text-xs text-amber-600">No active structures yet — mark one as Active first.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Override Basic Salary (optional)</Label>
                <Input type="number" value={assignForm.overrideBasicSalary} onChange={e => setAssignForm({ ...assignForm, overrideBasicSalary: e.target.value })} placeholder="Leave blank to use the structure's basic salary" />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={assignForm.reason} onChange={e => setAssignForm({ ...assignForm, reason: e.target.value })} placeholder="e.g. New hire onboarding, promotion" />
              </div>
              <Button
                onClick={() => assignMutation.mutate(assignForm)}
                disabled={assignMutation.isPending || !assignForm.structureId}
                className="w-full mt-2 bg-slate-900"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign Structure'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
