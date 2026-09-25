// @ts-nocheck
import React, { useState, useEffect } from "react";
import { employeesApi, onboardingApi } from "@/api";
import { isEmployee, isAdmin } from "@/lib/roleUtils";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "../components/dashboard/StatsCard";
import EmployeeList from "../components/dashboard/EmployeeList";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import CelebrationsWidget from "../components/dashboard/CelebrationsWidget";
import DashboardEmptyState from "../components/dashboard/DashboardEmptyState";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EmployeeDetail from "./EmployeeDetail";

import { useAuth } from "@/lib/AuthContext";

const employmentStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_ONBOARDING", label: "Pending Onboarding" },
  { value: "ONGOING_ONBOARDING", label: "Ongoing Onboarding" },
  { value: "PROBATION", label: "Probation" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "OFFBOARDED", label: "Offboarded" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
];

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth();
  const canLoadDashboard = Boolean(user) && !isEmployee(user);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', 'dashboard-all'],
    queryFn: async () => {
      const list = await employeesApi.getAllEmployees();
      return list.map(emp => ({
        ...emp,
        id: emp._id || emp.id,
        full_name: emp.fullName,
        job_title: emp.jobTitle,
        employment_status: emp.employmentStatus,
        onboarding_status: emp.onboardingStatus || (emp.employmentStatus === 'ACTIVE' ? 'completed' : 'in_progress'),
        progress_percentage: emp.onboardingProgress ?? (emp.employmentStatus === 'ACTIVE' ? 100 : 50),
      }));
    },
    enabled: canLoadDashboard,
  });

  const { data: paginatedData, isLoading: loadingPaginated, isFetching } = useQuery({
    queryKey: ['paginatedEmployees', page, limit, searchTerm, statusFilter],
    queryFn: async () => {
      const params = { page, limit };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await employeesApi.getEmployees(params);
      const list = Array.isArray(res) ? res : res?.data || [];
      const meta = res?.pagination || res?.meta || {};
      const totalCount = meta.total ?? meta.totalCount ?? list.length;
      const totalPages = meta.totalPages ?? Math.ceil(totalCount / limit) ?? 1;
      return {
        employees: list.map(emp => ({
          ...emp,
          id: emp._id || emp.id,
          full_name: emp.fullName,
          job_title: emp.jobTitle,
          employment_status: emp.employmentStatus,
          onboarding_status: emp.onboardingStatus || (emp.employmentStatus === 'ACTIVE' ? 'completed' : 'in_progress'),
          progress_percentage: emp.onboardingProgress ?? (emp.employmentStatus === 'ACTIVE' ? 100 : 50),
        })),
        totalCount,
        totalPages,
        currentPage: meta.page ?? page,
      };
    },
    enabled: canLoadDashboard,
    placeholderData: (previousData) => previousData,
  });

  // Reset page to 1 when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);


  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['onboarding-tasks-dashboard'],
    queryFn: async () => {
      const res = await onboardingApi.getAllTasks();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    initialData: [],
    enabled: canLoadDashboard,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    initialData: [],
    enabled: canLoadDashboard,
  });

  // Calculate stats
  const totalEmployees = employees.length;
  const activeOnboarding = employees.filter(e => e.onboarding_status === 'in_progress').length;
  const completedOnboarding = employees.filter(e => e.onboarding_status === 'completed').length;
  const averageProgress = employees.length > 0 
    ? Math.round(employees.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / employees.length)
    : 0;

  const pendingTasks = tasks.filter(t => !t.isCompleted && t.status !== 'completed' && t.status !== 'done' && t.status !== 'approved').length;
  const pendingProfilesCount = employees.filter(e =>
    e.employment_status === 'PENDING_APPROVAL' || e.employmentStatus === 'PENDING_APPROVAL'
  ).length;

  const currentEmployees = paginatedData?.employees || [];

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

  if (isLoadingAuth) {
    return (
      <div className="p-8 mx-auto space-y-6 max-w-7xl animate-pulse">
        <div className="w-1/4 h-8 rounded bg-slate-200"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (isEmployee(user) && !isAdmin(user)) {
    return <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} />;
  }

  if (loadingEmployees || (canLoadDashboard && !employees)) {
    return (
      <div className="p-8 mx-auto space-y-6 max-w-7xl animate-pulse">
        <div className="w-1/4 h-8 rounded bg-slate-200"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // Check if this is an empty organization (1 or fewer employees)
  // For standard accounts without seed data, the CEO is the only employee (length 1) or length 0.
  if (employees.length <= 1) {
    return (
      <div className="p-4 mx-auto sm:p-8 max-w-7xl">
        <DashboardEmptyState user={user} />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 mx-auto space-y-8 md:p-8 max-w-7xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-700">Welcome back! Here's what's happening with onboarding.</p>
        </div>
        <Link to={`${PAGE_ROUTES.EMPLOYEES}?action=add`}>
          <Button className="px-5 text-white transition-all rounded-lg shadow-sm bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add employee
          </Button>
        </Link>
      </motion.div>

      {/* Pending Approvals CEO/Admin Banner */}
      {pendingProfilesCount > 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-start justify-between gap-4 p-5 text-white shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                {pendingProfilesCount} Employee {pendingProfilesCount === 1 ? 'Profile' : 'Profiles'} Awaiting Approval
              </h3>
              <p className="text-sm text-blue-100 mt-0.5">
                New employee profile data has been submitted and is waiting for your review and approval to activate.
              </p>
            </div>
          </div>
          <Link to={PAGE_ROUTES.PENDING_APPROVALS}>
            <Button className="font-medium text-blue-900 bg-white shadow-sm hover:bg-blue-50 shrink-0">
              Review Approvals ({pendingProfilesCount})
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <StatsCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          color="blue"
          trend={`${templates.length} templates`}
          isLoading={loadingEmployees}
        />
        <StatsCard
          title="Active Onboarding"
          value={activeOnboarding}
          icon={Clock}
          color="orange"
          trend={`${pendingTasks} pending tasks`}
          isLoading={loadingEmployees}
        />
        <StatsCard
          title="Completed"
          value={completedOnboarding}
          icon={CheckCircle}
          color="green"
          trend="This month"
          isLoading={loadingEmployees}
        />
        <StatsCard
          title="Avg. Progress"
          value={`${averageProgress}%`}
          icon={TrendingUp}
          color="purple"
          trend="Overall"
          isLoading={loadingEmployees}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-6 min-h-[550px] lg:h-[620px] mb-8">
        {/* Employee List - Takes 2 columns */}
        <div className="flex flex-col min-h-0 lg:col-span-2">
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200/60">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Employees</h2>
                <div className="flex w-full gap-2 md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full transition-colors pl-9 md:w-64 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm transition-colors border rounded-lg cursor-pointer border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-700"
                  >
                    <option value="all">All Status</option>
                    {employmentStatusOptions.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="relative flex-1 min-h-0 p-0 overflow-y-auto custom-scrollbar">
              {(loadingPaginated || isFetching) && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                  {/* Optional spinner */}
                </div>
              )}
              <EmployeeList 
                employees={currentEmployees} 
                isLoading={loadingPaginated && !paginatedData}
                onOpenDetail={handleOpenDetail}
              />
            </div>
            {paginatedData?.totalCount > 0 && (
              <div className="flex items-center justify-between p-4 text-sm border-t border-slate-100 shrink-0 bg-white">
                <span className="text-xs text-slate-500 sm:text-sm">
                  Showing {Math.min((page - 1) * limit + 1, paginatedData.totalCount)} to {Math.min(page * limit, paginatedData.totalCount)} of {paginatedData.totalCount} entries
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 px-2.5 gap-1 text-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-xs text-slate-600 px-1 font-medium whitespace-nowrap">
                    Page {page} of {paginatedData.totalPages || 1}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(paginatedData.totalPages || 1, p + 1))}
                    disabled={page >= (paginatedData.totalPages || 1)}
                    className="h-8 px-2.5 gap-1 text-xs"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div className="flex flex-col h-full min-h-0 gap-6">
          <CelebrationsWidget />
          <div className="flex flex-col flex-1 min-h-0">
            <RecentActivity />
          </div>
        </div>
      </motion.div>

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