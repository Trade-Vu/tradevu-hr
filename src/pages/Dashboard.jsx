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

export default function Dashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 5;

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
      const res = await employeesApi.getEmployees({ limit: 100 });
      const list = Array.isArray(res) ? res : res?.data || [];
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
    initialData: [],
  });

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
          employment_status: emp.employmentStatus,
          onboarding_status: emp.onboardingStatus || (emp.employmentStatus === 'ACTIVE' ? 'completed' : 'in_progress'),
          progress_percentage: emp.onboardingProgress ?? (emp.employmentStatus === 'ACTIVE' ? 100 : 50),
        })),
        totalCount: meta.total ?? list.length,
        totalPages: meta.totalPages ?? 1,
        currentPage: meta.page ?? page,
      };
    },
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
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await onboardingApi.getTemplates();
      return Array.isArray(res) ? res : (res?.data || []);
    },
    initialData: [],
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

  if (isEmployee(user) && !isAdmin(user)) {
    return <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} />;
  }

  if (loadingEmployees) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <DashboardEmptyState user={user} />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-700 tracking-tight">Welcome back! Here's what's happening with onboarding.</p>
        </div>
        <Link to={`${PAGE_ROUTES.EMPLOYEES}?action=add`}>
          <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm rounded-lg px-5 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add New Hire
          </Button>
        </Link>
      </motion.div>

      {/* Pending Approvals CEO/Admin Banner */}
      {pendingProfilesCount > 0 && (
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {pendingProfilesCount} Employee {pendingProfilesCount === 1 ? 'Profile' : 'Profiles'} Awaiting Approval
              </h3>
              <p className="text-sm text-blue-100 mt-0.5">
                New employee profile data has been submitted and is waiting for your review and approval to activate.
              </p>
            </div>
          </div>
          <Link to={PAGE_ROUTES.PENDING_APPROVALS}>
            <Button className="bg-white text-blue-900 hover:bg-blue-50 font-medium shadow-sm shrink-0">
              Review Approvals ({pendingProfilesCount})
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-6 h-[500px] mb-8">
        {/* Employee List - Takes 2 columns */}
        <div className="lg:col-span-2 min-h-0 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Employees</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full md:w-64 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-700 transition-colors cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex-1 p-0 relative min-h-0 overflow-y-auto custom-scrollbar">
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
            {paginatedData?.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm shrink-0">
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
          </div>
        </div>

        {/* Recent Activity - Takes 1 column */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          <CelebrationsWidget />
          <div className="flex-1 flex flex-col min-h-0">
            <RecentActivity />
          </div>
        </div>
      </motion.div>

      <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-transparent" hideCloseButton>
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