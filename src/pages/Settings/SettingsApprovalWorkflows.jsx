import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalsApi } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Plus, Edit, Trash2, ArrowRight, GitBranch } from "lucide-react";
import ApprovalStepsEditor from "@/components/approvals/ApprovalStepsEditor";
import { getApprovalRoleLabel, normalizeApprovalSteps } from "@/lib/approvalSteps";

// What an empty chain actually does server-side (it is not auto-approval).
const EMPTY_CHAIN_MESSAGE = "No steps: a single approval from an HR Admin, Super Admin or the employee's manager completes the request.";

const WORKFLOW_TYPES = [
  { value: 'leave', label: 'Leave Request' },
  { value: 'expense', label: 'Expense' },
  { value: 'loan', label: 'Loan' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'document', label: 'Document' },
  { value: 'profile_update', label: 'Profile Update' },
  { value: 'probation', label: 'Probation' },
  { value: 'offboarding', label: 'Offboarding' },
];

export default function SettingsApprovalWorkflows() {
  const queryClient = useQueryClient();
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const { data: workflowData = {}, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: approvalsApi.getWorkflows,
  });

  const workflows = (Array.isArray(workflowData) ? workflowData : workflowData?.data || []).map((workflow) => ({
    ...workflow,
    id: workflow.id || workflow._id,
    levels: Array.isArray(workflow.levels) ? workflow.levels : [],
  }));

  const [workflowForm, setWorkflowForm] = useState({
    name: '',
    type: 'leave',
    levels: [],
    isActive: true,
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, data }) => approvalsApi.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowWorkflowDialog(false);
      setEditingWorkflow(null);
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: approvalsApi.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setShowWorkflowDialog(false);
      setWorkflowForm({
        name: '',
        type: 'leave',
        levels: [],
        isActive: true,
      });
    },
  });
  
  const deleteWorkflowMutation = useMutation({
    mutationFn: approvalsApi.deleteWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      type: workflow.type,
      // Normalized so legacy 'FINANCE' steps show as Finance Admin instead of a blank select.
      levels: normalizeApprovalSteps(workflow.levels),
      isActive: workflow.isActive,
    });
    setShowWorkflowDialog(true);
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <GitBranch className="w-5 h-5 text-indigo-500" />
              Approval Workflows
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">Define the sequence of approvals required for different operations.</p>
          </div>
          <Dialog open={showWorkflowDialog} onOpenChange={(open) => {
            setShowWorkflowDialog(open);
            if (!open) {
              setEditingWorkflow(null);
              setWorkflowForm({
                name: '',
                type: 'leave',
                levels: [],
                isActive: true,
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingWorkflow ? 'Edit' : 'Create'} Approval Workflow</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingWorkflow) {
                  updateWorkflowMutation.mutate({ id: editingWorkflow.id, data: workflowForm });
                } else {
                  createWorkflowMutation.mutate(workflowForm);
                }
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Workflow Name</Label>
                    <Input value={workflowForm.name} onChange={(e) => setWorkflowForm(prev => ({ ...prev, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Workflow Type</Label>
                    <Select value={workflowForm.type} onValueChange={(value) => setWorkflowForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WORKFLOW_TYPES.map((workflowType) => (
                          <SelectItem key={workflowType.value} value={workflowType.value}>{workflowType.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {editingWorkflow && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={workflowForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setWorkflowForm(prev => ({ ...prev, isActive: value === 'active' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Approval Steps</Label>
                  <ApprovalStepsEditor
                    steps={workflowForm.levels}
                    onChange={(levels) => setWorkflowForm(prev => ({ ...prev, levels }))}
                    emptyMessage={EMPTY_CHAIN_MESSAGE}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowWorkflowDialog(false)}>Cancel</Button>
                  <Button type="submit" isLoading={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}>
                    {(createWorkflowMutation.isPending || updateWorkflowMutation.isPending) ? 'Saving...' : editingWorkflow ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-white rounded-full shadow-sm">
              <GitBranch className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No workflows configured</h3>
            <p className="max-w-sm mx-auto mt-2 text-slate-500">Create approval workflows to enforce sign-offs before requests like Leave or Payroll are processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {workflows.map(workflow => (
              <div key={workflow.id} className="relative p-6 overflow-hidden transition-all duration-200 bg-white border group border-slate-200 rounded-2xl hover:shadow-md">
                <div className="absolute top-0 left-0 w-1 h-full transition-opacity bg-indigo-500 opacity-0 group-hover:opacity-100" />
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-slate-900">{workflow.name}</h4>
                      <Badge variant="outline" className="font-medium bg-slate-50 text-slate-600 border-slate-200">{WORKFLOW_TYPES.find((type) => type.value === workflow.type)?.label || workflow.type}</Badge>
                      <Badge className={workflow.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-none border-none px-2 py-0.5 text-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border-none px-2 py-0.5 text-xs'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-500">{workflow.levels.length} Approval Level(s)</p>

                    {/* Visual Flow Representation */}
                    <div className="pt-5 mt-6 border-t border-slate-100">
                      {workflow.levels.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center w-10 h-10 text-xs font-bold border rounded-full shadow-sm bg-slate-100 border-slate-200 text-slate-600">
                              REQ
                            </div>
                            <span className="text-[10px] mt-1.5 text-slate-500 font-bold uppercase tracking-wider">Requester</span>
                          </div>
                          
                          {[...workflow.levels].sort((a, b) => a.order - b.order).map((step, idx) => (
                            <div className="contents" key={idx}>
                              <div className="px-1 text-slate-300">
                                 <ArrowRight className="w-5 h-5" />
                              </div>
                              <div className="relative flex flex-col items-center justify-center">
                                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                                  {step.order}
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-indigo-700 border border-indigo-200 rounded-full shadow-sm bg-indigo-50">
                                  {getApprovalRoleLabel(step.role).substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-[10px] mt-1.5 text-indigo-700 font-bold uppercase tracking-wider">{getApprovalRoleLabel(step.role)}</span>
                              </div>
                            </div>
                          ))}

                          <div className="contents">
                            <div className="px-1 text-slate-300">
                               <ArrowRight className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center justify-center w-10 h-10 text-green-600 border border-green-200 rounded-full shadow-sm bg-green-50">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] mt-1.5 text-green-700 font-bold uppercase tracking-wider">Approved</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 border rounded-lg bg-amber-50 text-amber-700 border-amber-200/50">
                          <CheckCircle className="w-4 h-4" />
                          <p className="text-sm font-medium">{EMPTY_CHAIN_MESSAGE}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <Button size="sm" variant="ghost" className="h-8 px-3 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700" onClick={() => handleEditWorkflow(workflow)}>
                      <Edit className="w-4 h-4 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => deleteWorkflowMutation.mutate(workflow.id)} disabled={deleteWorkflowMutation.isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
