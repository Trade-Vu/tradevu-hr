import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeesApi, approvalsApi, leaveApi, payrollApi, onboardingApi, compensationApi } from '@/api';
import { isEmployee, isAdmin } from '@/lib/roleUtils';
import { useAuth } from '@/lib/AuthContext';

export function useDashboardData() {
  const { user, isLoadingAuth } = useAuth();
  const canLoadDashboard = Boolean(user) && !isEmployee(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const limit = 10;

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // 1. All Employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', 'dashboard-all'],
    queryFn: async () => {
      const list = await employeesApi.getAllEmployees();
      return (list || []).map((emp) => ({
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

  // 2. Paginated Employees for Table
  const { data: paginatedData, isLoading: loadingPaginated, isFetching: fetchingPaginated } = useQuery({
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
        employees: list.map((emp) => ({
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
    placeholderData: (prev) => prev,
  });

  // 3. Pending Approval Counts
  const { data: pendingCounts = {}, isLoading: loadingPendingCounts } = useQuery({
    queryKey: ['pending-counts-dashboard'],
    queryFn: async () => {
      try {
        const res = await approvalsApi.getPendingCounts();
        return res || {};
      } catch (err) {
        return {};
      }
    },
    enabled: canLoadDashboard,
  });

  // 4. Leave Requests (To determine who is out of office today)
  const { data: allLeaves = [] } = useQuery({
    queryKey: ['leaves-dashboard'],
    queryFn: async () => {
      try {
        const res = await leaveApi.getAllRequests({ limit: 50 });
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: canLoadDashboard,
  });

  // 5. Payroll Runs
  const { data: payrollRuns = [] } = useQuery({
    queryKey: ['payroll-runs-dashboard'],
    queryFn: async () => {
      try {
        const res = await payrollApi.getRuns({ limit: 3 });
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: canLoadDashboard,
  });

  // 6. Compensation Assignments (Employees enrolled in payroll structures)
  const { data: compensationAssignments = [] } = useQuery({
    queryKey: ['compensation-assignments-dashboard'],
    queryFn: async () => {
      try {
        const res = await compensationApi.getAssignments();
        const list = Array.isArray(res) ? res : res?.data || [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        return [];
      }
    },
    enabled: canLoadDashboard,
  });

  // Derived: Who is Out of Office Today?
  const onLeaveToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allLeaves.filter((req) => {
      const isApproved = req.status === 'APPROVED' || req.status === 'approved';
      if (!isApproved) return false;
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });
  }, [allLeaves]);

  // Derived: Active Payroll Status
  const latestPayrollRun = useMemo(() => {
    if (!payrollRuns || payrollRuns.length === 0) return null;
    return payrollRuns[0];
  }, [payrollRuns]);

  // Derived: Operational counts
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.employment_status === 'ACTIVE').length;
  const pendingProfilesCount = employees.filter(
    (e) => e.employment_status === 'PENDING_APPROVAL' || e.employmentStatus === 'PENDING_APPROVAL'
  ).length;

  const totalPendingApprovals = useMemo(() => {
    const rawTotal =
      (pendingCounts.total || 0) ||
      ((pendingCounts.leave || 0) +
        (pendingCounts.employees || 0) +
        (pendingCounts.tasks || 0) +
        (pendingCounts.documents || 0));
    return Math.max(rawTotal, pendingProfilesCount);
  }, [pendingCounts, pendingProfilesCount]);

  const payrollEnrolledCount = useMemo(() => {
    if (
      latestPayrollRun &&
      typeof latestPayrollRun.employeeCount === 'number' &&
      latestPayrollRun.employeeCount > 0
    ) {
      return latestPayrollRun.employeeCount;
    }
    if (compensationAssignments.length > 0) {
      return compensationAssignments.length;
    }
    return activeEmployees;
  }, [latestPayrollRun, compensationAssignments, activeEmployees]);

  return {
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
    payrollEnrolledCount,
  };
}
