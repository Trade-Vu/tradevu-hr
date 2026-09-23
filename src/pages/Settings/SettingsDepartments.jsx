import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, employeesApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, ExternalLink, Building, Briefcase, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { toast } from "sonner";

export default function SettingsDepartments() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserRole = user?.role || 'HR_ADMIN';

  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', headEmployeeId: 'none' });
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [capacityDraft, setCapacityDraft] = useState('');

  const { data: rawDepartments = [], isLoading: deptLoading } = useDepartments();

  const { data: rawEmployees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: async () => {
      return employeesApi.getAllEmployees();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const employees = (Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.data || []).map(emp => ({
    ...emp,
    id: emp._id || emp.id,
    fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
  }));

  const departments = (Array.isArray(rawDepartments) ? rawDepartments : rawDepartments?.data || []).map(dept => {
    const deptId = dept._id || dept.id;
    const deptEmployees = employees.filter(emp => {
      const empDeptId = emp.departmentId?._id || emp.departmentId?.id || emp.departmentId;
      return empDeptId && String(empDeptId) === String(deptId);
    });
    const headEmpId = dept.managerId?._id || dept.managerId?.id || (typeof dept.managerId === 'string' ? dept.managerId : null);

    return {
      ...dept,
      id: deptId,
      code: dept.code || '',
      status: dept.status || (dept.isActive ? 'APPROVED' : 'INACTIVE'),
      headEmployeeId: headEmpId,
      employees: deptEmployees,
    };
  });

  const selectedDept = departments.find(d => d.id === selectedDeptId) || null;

  useEffect(() => {
    setCapacityDraft(selectedDept?.maxConcurrentLeave ?? '');
  }, [selectedDeptId]);

  const createDeptMutation = useMutation({
    mutationFn: async (data) => {
      return await departmentsApi.createDepartment({
        name: data.name,
        code: data.code || undefined,
        managerId: data.headEmployeeId && data.headEmployeeId !== 'none' ? data.headEmployeeId : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowDeptDialog(false);
      setDeptForm({ name: '', code: '', headEmployeeId: 'none' });
      toast.success("Department created successfully");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create department");
    }
  });

  const approveDeptMutation = useMutation({
    mutationFn: async (id) => {
      return await departmentsApi.updateDepartment(id, { status: 'APPROVED' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success("Department approved");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to approve department");
    }
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id) => {
      return await departmentsApi.deleteDepartment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (selectedDeptId) setSelectedDeptId(null);
      toast.success("Department deleted");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete department");
    }
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, headEmployeeId }) => {
      return await departmentsApi.updateDepartment(id, {
        managerId: headEmployeeId && headEmployeeId !== 'none' ? headEmployeeId : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success("Department head updated");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update department head");
    }
  });

  const updateCapacityMutation = useMutation({
    mutationFn: async ({ id, maxConcurrentLeave }) => {
      return await departmentsApi.updateDepartment(id, { maxConcurrentLeave });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success("Leave capacity updated");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update leave capacity");
    }
  });

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle>Departments & Hierarchy</CardTitle>
          <Dialog open={showDeptDialog} onOpenChange={(open) => {
            setShowDeptDialog(open);
            if (!open) setDeptForm({ name: '', code: '', headEmployeeId: 'none' });
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                createDeptMutation.mutate(deptForm);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Department Name</Label>
                  <Input value={deptForm.name} onChange={(e) => setDeptForm(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Department Code</Label>
                  <Input value={deptForm.code} onChange={(e) => setDeptForm(prev => ({ ...prev, code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Department Head</Label>
                  <Select value={deptForm.headEmployeeId} onValueChange={(val) => setDeptForm(prev => ({ ...prev, headEmployeeId: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select Head (Optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowDeptDialog(false)}>Cancel</Button>
                  <Button type="submit" isLoading={createDeptMutation.isPending}>
                    {createDeptMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {deptLoading ? <p>Loading...</p> : departments.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No departments found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
              {departments.map(dept => {
                const isDefaultDept = dept.name?.trim().toLowerCase() === 'human resources' || dept.name?.trim().toLowerCase() === 'hr';
                return (
              <Card key={dept.id} className="border-slate-200">
                <CardHeader className="pb-4 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{dept.name}</CardTitle>
                            {isDefaultDept && (
                              <Badge variant="outline" className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200">
                                Default
                              </Badge>
                            )}
                          </div>
                      <p className="text-sm text-slate-500">Code: {dept.code || 'N/A'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {dept.status === 'PENDING' && (
                        <Badge className="text-orange-700 bg-orange-100">Pending Approval</Badge>
                      )}
                      <div className="flex gap-2">
                        {dept.status === 'PENDING' && currentUserRole === 'SUPER_ADMIN' && (
                          <Button size="sm" onClick={() => approveDeptMutation.mutate(dept.id)} disabled={approveDeptMutation.isPending}>Approve</Button>
                        )}
                            {!isDefaultDept && (
                              <Button size="sm" variant="destructive" onClick={() => deleteDeptMutation.mutate(dept.id)} disabled={deleteDeptMutation.isPending} title="Delete department">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Employees ({dept.employees?.length || 0})</h4>
                  <div className="space-y-2">
                    {dept.employees?.slice(0, 3).map(emp => (
                      <div key={emp.id} className="flex items-center justify-between p-2 bg-white border rounded border-slate-100">
                        <div>
                          <p className="text-sm font-medium">{emp.fullName}</p>
                          <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                        </div>
                        {emp.id === dept.headEmployeeId && (
                          <Badge className="text-blue-700 border-blue-200 bg-blue-50">Dept Head</Badge>
                        )}
                      </div>
                    ))}
                    {!dept.employees?.length && <p className="text-xs text-slate-400">No employees assigned.</p>}
                    {dept.employees?.length > 3 && (
                      <p className="py-1 text-xs text-center text-slate-500">...and {dept.employees.length - 3} more</p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-indigo-600 bg-white border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => setSelectedDeptId(dept.id)}
                  >
                    View Details <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
                );
              })}
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedDept} onOpenChange={(open) => !open && setSelectedDeptId(null)}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-xl overflow-hidden gap-0 bg-white">
          {selectedDept && (
            <>
              {/* Header Banner */}
              <div className="relative p-6 text-white bg-gradient-to-r from-indigo-600 to-violet-600 md:p-8">
                <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
                  <Building className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h2 className="flex items-center gap-3 text-3xl font-bold">
                    {selectedDept.name}
                    {selectedDept.status === 'APPROVED' && <Badge className="text-xs font-medium text-white border-none shadow-none bg-white/20 hover:bg-white/30">Approved</Badge>}
                    {selectedDept.status === 'PENDING' && <Badge className="text-xs font-medium text-white border-none shadow-none bg-white/20 hover:bg-white/30">Pending</Badge>}
                  </h2>
                  <p className="flex items-center gap-2 mt-2 font-medium text-indigo-100 opacity-90">
                    <Building className="w-4 h-4" /> Department Code: {selectedDept.code || 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Content Body */}
              <div className="flex flex-col md:flex-row">
                
                {/* Left Sidebar (Info) */}
                <div className="w-full p-6 border-r md:w-1/3 bg-slate-50/50 md:p-8 border-slate-100">
                  <h3 className="mb-6 text-xs font-bold tracking-wider uppercase text-slate-400">Details</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Department Name</p>
                      <p className="text-sm font-medium text-slate-900">{selectedDept.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Department Code</p>
                      <p className="text-sm font-medium text-slate-900">{selectedDept.code || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Total Headcount</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 text-indigo-600 bg-indigo-100 rounded-full">
                          <Users className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{selectedDept.employees?.length || 0} Employees</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1.5">Leave Capacity</p>
                      {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="No limit"
                            value={capacityDraft}
                            onChange={(e) => setCapacityDraft(e.target.value)}
                            className="w-24 bg-white"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateCapacityMutation.isPending}
                            onClick={() => updateCapacityMutation.mutate({
                              id: selectedDept.id,
                              maxConcurrentLeave: capacityDraft === '' ? null : Number(capacityDraft),
                            })}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-900">
                          {selectedDept.maxConcurrentLeave ? `${selectedDept.maxConcurrentLeave} people max` : 'No limit set'}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Max employees who can be off on the same day before the Annual Leave Planner flags a conflict.
                      </p>
                    </div>
                  </div>

                  {/* Department Head Assignment */}
                  <div className="pt-8 mt-8 border-t border-slate-200/60">
                    <p className="mb-4 text-xs font-bold tracking-wider uppercase text-slate-400">Department Head</p>
                    {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') ? (
                      <div className="space-y-2">
                        <Select 
                          value={selectedDept.headEmployeeId || 'none'} 
                          onValueChange={(val) => {
                            updateDeptMutation.mutate({ id: selectedDept.id, headEmployeeId: val });
                          }}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-200">
                            <SelectValue placeholder="Assign Head" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Department Head</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          The department head has access to approve workflows and manage team settings.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm border-slate-100">
                        {selectedDept.headEmployeeId ? (
                          <>
                            <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-indigo-700 bg-indigo-100 rounded-full">
                              {employees.find(e => e.id === selectedDept.headEmployeeId)?.fullName.substring(0, 2).toUpperCase() || 'DH'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{employees.find(e => e.id === selectedDept.headEmployeeId)?.fullName}</p>
                              <Badge className="bg-indigo-50 text-indigo-700 border-none px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider mt-0.5">Head</Badge>
                            </div>
                          </>
                        ) : (
                          <p className="px-2 text-sm italic font-medium text-slate-500">No head assigned</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right Main Content (Employees) */}
                <div className="w-full p-6 bg-white md:w-2/3 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Team Members</h3>
                    <Badge variant="outline" className="font-medium text-slate-500 bg-slate-50">{selectedDept.employees?.length || 0} Total</Badge>
                  </div>
                  
                  {selectedDept.employees?.length > 0 ? (
                    <div className="space-y-3 overflow-y-auto h-[450px]">
                      {selectedDept.employees.map(emp => {
                        const initials = emp.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const isHead = emp.id === selectedDept.headEmployeeId;
                        return (
                          <div 
                            key={emp.id} 
                            onClick={() => navigate(`${PAGE_ROUTES.EMPLOYEE_DETAIL}?id=${emp.id}`)}
                            className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${isHead ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-indigo-700 rounded-full shadow-inner bg-gradient-to-br from-indigo-100 to-violet-100">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                  {emp.fullName}
                                  {isHead && <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider h-5">Head</Badge>}
                                </div>
                                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                                  <Briefcase className="w-3.5 h-3.5 opacity-70" /> {emp.jobTitle}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="font-medium text-indigo-600 transition-opacity opacity-0 group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-700">
                              View Profile
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <div className="flex items-center justify-center mx-auto mb-4 bg-white rounded-full shadow-sm w-14 h-14">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No team members</h3>
                      <p className="mt-1 text-sm text-slate-500">This department has no employees yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
