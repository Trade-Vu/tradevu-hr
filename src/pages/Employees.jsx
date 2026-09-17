import React, { useState, useEffect } from "react";
import { employeesApi, onboardingApi } from "@/api";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDepartments } from "@/hooks/useDepartmentsQuery";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { ArrowLeft, Plus, Upload, Grid, List, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmployeeList from "../components/dashboard/EmployeeList";
import AddEmployeeForm from "../components/employees/AddEmployeeForm";
import BulkImportDialog from "../components/employees/BulkImportDialog";
import InviteEmployeeDialog from "../components/employees/InviteEmployeeDialog";
import EmployeeCard from "../components/employees/EmployeeCard";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmployeeDetail from "./EmployeeDetail";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CardSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array(6).fill(0).map((_, i) => (
      <div key={i} className="h-[280px] bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col animate-pulse">
        <div className="flex items-start gap-4 mb-5">
          <div className="rounded-full w-14 h-14 bg-slate-100 shrink-0"></div>
          <div className="flex-1 py-1 space-y-2">
            <div className="w-3/4 h-4 rounded bg-slate-100"></div>
            <div className="flex gap-2">
              <div className="w-1/4 h-4 rounded bg-slate-100"></div>
              <div className="w-1/3 h-4 rounded bg-slate-100"></div>
            </div>
          </div>
        </div>
        <div className="mb-auto space-y-3">
          <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-2/3 h-3 rounded bg-slate-100"></div></div>
          <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-1/2 h-3 rounded bg-slate-100"></div></div>
          <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-md bg-slate-100"></div><div className="w-1/3 h-3 rounded bg-slate-100"></div></div>
        </div>
        <div className="flex justify-between pt-4 mt-4 border-t border-slate-100">
          <div className="w-1/4 h-3 rounded bg-slate-100"></div>
          <div className="w-1/4 h-3 rounded bg-slate-100"></div>
        </div>
      </div>
    ))}
  </div>
);

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  const [showAddForm, setShowAddForm] = useState(action === 'add');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const handleOpenDetail = (empOrId) => {
    if (typeof empOrId === 'object' && empOrId !== null) {
      setSelectedEmployee(empOrId);
      setSelectedEmployeeId(empOrId.id || empOrId._id);
    } else {
      setSelectedEmployeeId(empOrId);
      setSelectedEmployee(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
  };

  const { data: paginatedData, isLoading: loadingPaginated, isFetching } = useQuery({
    queryKey: ['paginatedEmployees', page, limit, searchTerm, statusFilter],
    queryFn: async () => {
      const params = { page, limit };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await employeesApi.getEmployees(params);
      const list = Array.isArray(res) ? res : res?.data || [];
      const meta = res?.meta || {};

      return {
        employees: list.map(emp => ({
          ...emp,
          id: emp._id || emp.id,
          full_name: emp.fullName,
          job_title: emp.jobTitle,
          phone: emp.phone,
          department_name: emp.departmentId?.name || emp.department?.name || emp.department,
          employment_status: emp.employmentStatus,
          onboarding_status: emp.onboardingStatus || (emp.employmentStatus === 'ACTIVE' ? 'completed' : 'in_progress'),
          progress_percentage: emp.onboardingProgress ?? (emp.employmentStatus === 'ACTIVE' ? 100 : 50),
          start_date: emp.hireDate
        })),
        totalCount: meta.total ?? list.length,
        totalPages: meta.totalPages ?? 1,
        currentPage: meta.page ?? page
      };
    },
    placeholderData: keepPreviousData,
  });

  // Reset page to 1 when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      const list = Array.isArray(res) ? res : (res?.data || []);
      return list.map(t => ({
        id: t._id || t.id,
        name: t.name,
      }));
    },
    initialData: [],
  });

  const { data: departments = [] } = useDepartments();

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData) => {
      let isoHireDate = undefined;
      if (employeeData.start_date) {
        const d = new Date(employeeData.start_date);
        if (!isNaN(d.getTime())) isoHireDate = d.toISOString();
      }

      const payload = {
        fullName: employeeData.full_name,
        email: employeeData.email,
        jobTitle: employeeData.job_title,
        departmentId: employeeData.department_id || undefined,
        employmentType: employeeData.employment_type || 'FULL_TIME',
        hireDate: isoHireDate,
        basicSalary: parseFloat(employeeData.basic_salary) || 0,
        templateId: employeeData.template_id || undefined,
        employeeClass: employeeData.employeeClass || undefined,
        frontendUrl: window.location.origin,
      };

      return employeesApi.createEmployee(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Employee created and invitation email sent!');
      setShowAddForm(false);
      navigate(PAGE_ROUTES.EMPLOYEES);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create employee');
    }
  });

  const bulkCreateEmployeesMutation = useMutation({
    mutationFn: async (employeesData) => {
      const payload = employeesData.map(emp => {
        let isoHireDate = undefined;
        if (emp.start_date) {
          const d = new Date(emp.start_date);
          if (!isNaN(d.getTime())) isoHireDate = d.toISOString();
        }
        return {
          fullName: emp.full_name,
          email: emp.email,
          jobTitle: emp.job_title,
          departmentId: emp.department_id || undefined,
          employmentType: 'FULL_TIME',
          hireDate: isoHireDate,
          basicSalary: parseFloat(emp.basic_salary) || 0,
          statusHistory: emp.status_history || undefined,
        };
      });

      return employeesApi.bulkImport(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['paginatedEmployees'] });
      setShowImportDialog(false);
      if (data?.created > 0) {
        toast.success(`Successfully imported ${data.created} employee${data.created !== 1 ? 's' : ''}!`);
      } else {
        toast.info(data?.errors?.[0]?.message || 'No new employees were imported.');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import employees.');
    }
  });


  const currentEmployees = paginatedData?.employees || [];
  const totalEmployees = paginatedData?.totalCount || 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 mx-auto space-y-8 md:p-8 max-w-7xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-start gap-4">
          {showAddForm && (
            <Button
              variant="outline"
              size="icon"
              className="mt-1 rounded-xl border-slate-200 hover:bg-slate-50"
              onClick={() => {
                setShowAddForm(false);
                navigate(PAGE_ROUTES.EMPLOYEES);
              }}
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          )}
          <div>
            {!showAddForm && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full mb-4">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold tracking-wider text-indigo-700 uppercase">Directory</span>
              </div>
            )}
            
            <p className="mt-1 text-slate-500">
              {showAddForm 
                ? "Add a new team member to your organization." 
                : `Manage your ${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
        {!showAddForm && (
          <div className="flex gap-3 shrink-0">
            {/* <Button 
              onClick={() => setShowInviteDialog(true)}
              variant="outline"
              className="text-indigo-700 border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              <Users className="w-4 h-4 mr-2" />
              Invite User
            </Button> */}
            <Button 
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              className="text-indigo-700 border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        )}
      </motion.div>

      {/* Content */}
      {showAddForm ? (
        <motion.div variants={itemVariants}>
          <AddEmployeeForm
            templates={templates}
            departments={departments}
            onSubmit={(data) => createEmployeeMutation.mutate(data)}
            onCancel={() => {
              setShowAddForm(false);
              navigate(PAGE_ROUTES.EMPLOYEES);
            }}
            isSubmitting={createEmployeeMutation.isPending}
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Filters and View Toggle */}
          <div className="p-4 bg-white border shadow-sm rounded-2xl border-slate-200/60">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex flex-col w-full gap-3 sm:flex-row md:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 transition-colors rounded-lg border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                  <SelectTrigger className="w-full rounded-lg sm:w-40 border-slate-200 bg-slate-50 focus:bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="shadow-lg rounded-xl border-slate-100">
                    <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PROBATION">Probation</SelectItem>
                      <SelectItem value="PENDING_ONBOARDING">Pending Onboarding</SelectItem>
                      <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="RESIGNED">Resigned</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                      <SelectItem value="OFFBOARDED">Offboarded</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-md px-3 ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className={`rounded-md px-3 ${viewMode === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setViewMode('cards')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {loadingPaginated && !paginatedData ? (
            viewMode === 'list' ? (
              <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200/60">
                <EmployeeList employees={[]} isLoading={true} onOpenDetail={handleOpenDetail} />
              </div>
            ) : (
              <CardSkeleton />
            )
          ) : currentEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed bg-white/50 border-slate-200/60 rounded-2xl">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-white border shadow-sm rounded-2xl border-slate-100">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No employees found</h3>
              <p className="max-w-sm mt-1 text-slate-500">We couldn't find any employees matching your search criteria.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="relative overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200/60">
              {(loadingPaginated || isFetching) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none" />
              )}
              <EmployeeList employees={currentEmployees} isLoading={false} onOpenDetail={handleOpenDetail} />
            </div>
          ) : (
            <motion.div 
              className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {(loadingPaginated || isFetching) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none -m-4 p-4 rounded-xl" />
              )}
              {currentEmployees.map((employee) => (
                <motion.div key={employee.id} variants={itemVariants}>
                  <EmployeeCard 
                    employee={employee} 
                    onOpenDetail={handleOpenDetail}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {paginatedData?.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 mt-6 text-sm border-t border-slate-100">
              <span className="text-slate-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, paginatedData.totalCount)} of {paginatedData.totalCount} entries
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(paginatedData.totalPages, p + 1))}
                  disabled={page === paginatedData.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <BulkImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={(data) => bulkCreateEmployeesMutation.mutate(data)}
        isImporting={bulkCreateEmployeesMutation.isPending}
        templates={templates}
        departments={departments}
      />

      <InviteEmployeeDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />

      <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden bg-transparent border-0 shadow-2xl rounded-2xl" hideCloseButton>
          <DialogTitle className="sr-only">Employee Detail</DialogTitle>
          <DialogDescription className="sr-only">Detailed view of the selected employee's information.</DialogDescription>
          {selectedEmployeeId && (
            <EmployeeDetail 
              employeeIdProp={selectedEmployeeId} 
              employeeDetail={selectedEmployee}
              onClose={handleCloseDetail} 
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

