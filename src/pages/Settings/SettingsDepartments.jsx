import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, employeesApi, usersApi } from "@/api";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Building, 
  Briefcase, 
  Loader2, 
  AlertTriangle,
  UserPlus,
  Send,
  Clock,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { toast } from "sonner";
import InviteHRModal from "@/components/dashboard/InviteHRModal";

export default function SettingsDepartments() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserRole = user?.role || 'HR_ADMIN';

  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', headEmployeeId: 'none' });
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [capacityDraft, setCapacityDraft] = useState('');

  const [inviteModalState, setInviteModalState] = useState({
    open: false,
    initialEmail: '',
    isResend: false,
    defaultFullName: '',
    defaultJobTitle: '',
  });

  const handleOpenInviteHR = () => {
    setInviteModalState({
      open: true,
      initialEmail: '',
      isResend: false,
      defaultFullName: '',
      defaultJobTitle: 'Head of People',
    });
  };

  const handleResendHRInvite = (admin) => {
    if (admin.isActive) {
      toast.error('This user is already active on the platform and cannot be reinvited.');
      return;
    }
    setInviteModalState({
      open: true,
      initialEmail: admin.email,
      isResend: true,
      defaultFullName: admin.fullName && admin.fullName !== admin.email ? admin.fullName : '',
      defaultJobTitle: admin.jobTitle || 'Head of People',
    });
  };

  const { data: rawDepartments = [], isLoading: deptLoading } = useDepartments();

  const { data: rawEmployees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: async () => {
      return employeesApi.getAllEmployees();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: rawUsers = [] } = useQuery({
    queryKey: ['users', 'org', 'includeInactive'],
    queryFn: async () => {
      try {
        const res = await usersApi.getUsers({ includeInactive: true });
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const employees = (Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.data || []).map(emp => ({
    ...emp,
    id: emp._id || emp.id,
    fullName: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email,
  }));

  const hrAdminUsers = (Array.isArray(rawUsers) ? rawUsers : rawUsers?.data || [])
    .filter(u => u.role === 'HR_ADMIN');

  const hrAdminsList = hrAdminUsers.map(u => {
    const matchedEmp = employees.find(
      e => (u.employeeId && (String(e.id) === String(u.employeeId) || String(e._id) === String(u.employeeId))) ||
           (e.email && u.email && e.email.toLowerCase() === u.email.toLowerCase())
    );
    const fullName = matchedEmp?.fullName || u.fullName || u.email;
    const jobTitle = matchedEmp?.jobTitle || (u.isOrgOwner ? 'Org Owner & HR Admin' : 'HR Administrator');
    const isActive = Boolean(u.isActive);
    const isInviteExpired = !isActive && u.inviteTokenExpires && new Date(u.inviteTokenExpires) < new Date();
    return {
      userId: u._id || u.id,
      employeeId: matchedEmp?.id || u.employeeId,
      email: u.email,
      fullName,
      jobTitle,
      isActive,
      isInviteExpired,
      lastLogin: u.lastLogin,
      employee: matchedEmp,
    };
  });

  employees.forEach(emp => {
    if (emp.role === 'HR_ADMIN' && !hrAdminsList.some(h => h.email?.toLowerCase() === emp.email?.toLowerCase())) {
      hrAdminsList.push({
        userId: emp.userId,
        employeeId: emp.id,
        email: emp.email,
        fullName: emp.fullName,
        jobTitle: emp.jobTitle || 'HR Administrator',
        isActive: emp.employmentStatus === 'ACTIVE',
        isInviteExpired: false,
        employee: emp,
      });
    }
  });

  const activeHrCount = hrAdminsList.filter(h => h.isActive).length;
  const pendingHrCount = hrAdminsList.filter(h => !h.isActive).length;

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
      if (selectedDeptId === deptToDelete?.id) setSelectedDeptId(null);
      setDeptToDelete(null);
      toast.success("Department deleted successfully");
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg">{dept.name}</CardTitle>
                            {isDefaultDept && (
                              <Badge variant="outline" className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200">
                                Default
                              </Badge>
                            )}
                            {isDefaultDept && pendingHrCount > 0 && (
                              <Badge className="text-[10px] font-medium bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
                                {pendingHrCount} Pending Invite{pendingHrCount > 1 ? 's' : ''}
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
                        {isDefaultDept && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold text-indigo-600 bg-white border-indigo-200 hover:bg-indigo-50 shadow-xs"
                            onClick={() => handleOpenInviteHR()}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1" />
                            Invite HR
                          </Button>
                        )}
                        {!isDefaultDept && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeptToDelete(dept)}
                            disabled={deleteDeptMutation.isPending}
                            title="Delete department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {isDefaultDept && (
                    <div className="mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          HR Admins ({hrAdminsList.length})
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {activeHrCount} Active{pendingHrCount > 0 ? ` • ${pendingHrCount} Pending` : ''}
                        </span>
                      </div>

                      {pendingHrCount > 0 && (
                        <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs space-y-1.5 mb-2">
                          <p className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Invites awaiting acceptance
                          </p>
                          {hrAdminsList.filter(h => !h.isActive).slice(0, 2).map(h => (
                            <div key={h.email} className="flex items-center justify-between bg-white/90 px-2 py-1 rounded border border-amber-200/70 text-[11px]">
                              <div className="truncate max-w-[150px]">
                                <p className="font-semibold text-slate-800 truncate">{h.fullName || h.email}</p>
                                <p className="text-slate-500 text-[10px] truncate">{h.email}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold px-2"
                                onClick={() => handleResendHRInvite(h)}
                              >
                                <Send className="w-2.5 h-2.5 mr-1" />
                                Resend
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Danger Zone: Delete Department (only for custom departments) */}
                  {selectedDept && !['human resources', 'hr'].includes(selectedDept.name?.trim().toLowerCase()) && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') && (
                    <div className="pt-6 mt-6 border-t border-slate-200/60">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                        onClick={() => setDeptToDelete(selectedDept)}
                        disabled={deleteDeptMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Department
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Right Main Content (Employees & HR Admins) */}
                <div className="w-full p-6 bg-white md:w-2/3 md:p-8">
                  {selectedDept && (selectedDept.name?.trim().toLowerCase() === 'human resources' || selectedDept.name?.trim().toLowerCase() === 'hr') && (
                    <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-violet-50/30 rounded-2xl border border-indigo-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-900">HR Administrators</h3>
                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-xs">
                              {hrAdminsList.length} Total
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Team members with full HR Administrator and workflow approval access across Tradevu HR.
                          </p>
                        </div>
                        {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-8 shadow-xs shrink-0"
                            onClick={() => handleOpenInviteHR()}
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            Invite HR Admin
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {hrAdminsList.length === 0 ? (
                          <p className="text-xs text-slate-500 italic p-3 bg-white rounded-lg border border-slate-100">
                            No HR Administrators found. Click Invite HR Admin to add one.
                          </p>
                        ) : (
                          hrAdminsList.map(admin => {
                            const initials = (admin.fullName || admin.email)
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase();
                            return (
                              <div
                                key={admin.email}
                                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex items-center justify-center w-10 h-10 text-xs font-bold text-indigo-700 rounded-full bg-indigo-50 border border-indigo-100 shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-bold text-slate-900 truncate">{admin.fullName}</span>
                                      {admin.isActive ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                          Active
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold px-2 py-0.5 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          Invite Pending
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                                      <span className="flex items-center gap-1 truncate">
                                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                        {admin.email}
                                      </span>
                                      <span>•</span>
                                      <span className="truncate">{admin.jobTitle || 'Head of People'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'HR_ADMIN') && !admin.isActive && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-amber-800 border-amber-300 hover:bg-amber-100 font-semibold text-xs h-8"
                                      onClick={() => handleResendHRInvite(admin)}
                                    >
                                      <Send className="w-3 h-3 mr-1.5" />
                                      Resend Invite
                                    </Button>
                                  )}
                                  {admin.employeeId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-slate-600 hover:text-slate-900 text-xs h-8"
                                      onClick={() => navigate(`${PAGE_ROUTES.EMPLOYEE_DETAIL}?id=${admin.employeeId}`)}
                                    >
                                      Profile
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">
                      {selectedDept && (selectedDept.name?.trim().toLowerCase() === 'human resources' || selectedDept.name?.trim().toLowerCase() === 'hr')
                        ? 'Department Employees'
                        : 'Team Members'}
                    </h3>
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

      {/* Delete Department Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deptToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteDeptMutation.isPending) {
            setDeptToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-bold text-slate-900">
                  Delete Department
                </AlertDialogTitle>
                <p className="text-xs text-slate-500 font-medium">This action deactivates the department</p>
              </div>
            </div>
            <AlertDialogDescription asChild>
              <div className="pt-2 text-sm text-slate-600 space-y-3">
                <p>
                  Are you sure you want to delete <strong className="text-slate-900 font-semibold">{deptToDelete?.name}</strong>{deptToDelete?.code ? ` (${deptToDelete.code})` : ''}?
                </p>

                {deptToDelete?.employees?.length > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">
                        {deptToDelete.employees.length} Assigned Employee{deptToDelete.employees.length > 1 ? 's' : ''}
                      </p>
                      <p className="mt-0.5 text-amber-700 leading-relaxed">
                        Deactivating this department will remove it from active lists and settings. Employee records will be preserved but won&apos;t belong to an active department.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    This department will be marked as inactive and removed from selection menus.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleteDeptMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors"
              disabled={deleteDeptMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deptToDelete?.id) {
                  deleteDeptMutation.mutate(deptToDelete.id);
                }
              }}
            >
              {deleteDeptMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Department'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InviteHRModal
        open={inviteModalState.open}
        onOpenChange={(open) => setInviteModalState(prev => ({ ...prev, open }))}
        initialEmail={inviteModalState.initialEmail}
        isResend={inviteModalState.isResend}
        defaultFullName={inviteModalState.defaultFullName}
        defaultJobTitle={inviteModalState.defaultJobTitle}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          queryClient.invalidateQueries({ queryKey: ['departments'] });
        }}
      />
    </Card>
  );
}
