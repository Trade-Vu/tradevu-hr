// @ts-nocheck
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { isEmployee, isAdmin } from '@/lib/roleUtils';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardMetricsGrid from '@/components/dashboard/DashboardMetricsGrid';
import QuickActions from '@/components/dashboard/QuickActions';
import WorkforceOverviewCard from '@/components/dashboard/WorkforceOverviewCard';
import OutOfOfficeWidget from '@/components/dashboard/OutOfOfficeWidget';
import CelebrationsWidget from '@/components/dashboard/CelebrationsWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import EmployeeQuickPreviewSheet from '@/components/dashboard/EmployeeQuickPreviewSheet';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';

export default function Dashboard() {
  const {
    user,
    isLoadingAuth,
    canLoadDashboard,
    employees,
    loadingEmployees,
    paginatedData,
    loadingPaginated,
    fetchingPaginated,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    previewEmployee,
    setPreviewEmployee,
    onLeaveToday,
    latestPayrollRun,
    totalEmployees,
    activeEmployees,
    pendingProfilesCount,
    totalPendingApprovals,
  } = useDashboardData();

  if (isLoadingAuth || loadingEmployees || (canLoadDashboard && !employees)) {
    return (
      <div className="p-4 sm:p-8 mx-auto space-y-6 max-w-7xl animate-pulse">
        <div className="w-1/3 h-8 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  // Non-admin employees route to self-service
  if (isEmployee(user) && !isAdmin(user)) {
    return <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace />;
  }

  // Check if organization has 1 or fewer employees
  if (employees.length <= 1) {
    return (
      <div className="p-4 sm:p-8 mx-auto max-w-7xl">
        <DashboardEmptyState user={user} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6 sm:space-y-8 max-w-7xl font-sans text-slate-900">
      {/* 1. Executive Greeting & Live Header */}
      <DashboardHeader user={user} totalPendingApprovals={totalPendingApprovals} />

      {/* 2. Priority Approvals Alert (if any pending employee profiles) */}
      {pendingProfilesCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 text-white shadow-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold truncate">
                {pendingProfilesCount} Employee {pendingProfilesCount === 1 ? 'Profile' : 'Profiles'} Awaiting Approval
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5 line-clamp-1">
                New employee profile data has been submitted and is waiting for your review to activate.
              </p>
            </div>
          </div>
          <Link to={PAGE_ROUTES.PENDING_APPROVALS} className="w-full sm:w-auto shrink-0">
            <Button className="w-full sm:w-auto font-medium text-xs sm:text-sm text-blue-900 bg-white shadow-xs hover:bg-blue-50 h-9">
              Review Approvals ({pendingProfilesCount})
            </Button>
          </Link>
        </motion.div>
      )}

      {/* 3. Operational KPIs Strip */}
      <DashboardMetricsGrid
        totalEmployees={totalEmployees}
        activeEmployees={activeEmployees}
        onLeaveTodayCount={onLeaveToday.length}
        latestPayrollRun={latestPayrollRun}
        totalPendingApprovals={totalPendingApprovals}
        isLoading={loadingEmployees}
      />

      {/* 4. High-Frequency Actions */}
      <QuickActions />

      {/* 5. Responsive Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Workforce Roster (2 cols on desktop) */}
        <div className="lg:col-span-2">
          <WorkforceOverviewCard
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            paginatedData={paginatedData}
            loadingPaginated={loadingPaginated}
            isFetching={fetchingPaginated}
            page={page}
            setPage={setPage}
            limit={limit}
            onOpenDetail={(emp) => setPreviewEmployee(emp)}
          />
        </div>

        {/* Right Column: Operational Pulse Sidebar (1 col) */}
        <div className="space-y-6">
          <OutOfOfficeWidget onLeaveList={onLeaveToday} />
          <CelebrationsWidget />
          <RecentActivity />
        </div>
      </div>

      {/* 6. Slide-Over Employee Quick Preview Sheet */}
      <EmployeeQuickPreviewSheet
        employee={previewEmployee}
        isOpen={Boolean(previewEmployee)}
        onClose={() => setPreviewEmployee(null)}
      />
    </div>
  );
}