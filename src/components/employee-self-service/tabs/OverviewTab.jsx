import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '@/api';
import EmployeeMetricsGrid from '../EmployeeMetricsGrid';
import EmployeeQuickActions from '../EmployeeQuickActions';
import EmployeeRecentActivityCard from '../EmployeeRecentActivityCard';
import EmployeeProfileSummaryCard from '../EmployeeProfileSummaryCard';
import UpcomingHolidaysWidget from '../UpcomingHolidaysWidget';
import OutOfOfficeWidget from '@/components/dashboard/OutOfOfficeWidget';
import CelebrationsWidget from '@/components/dashboard/CelebrationsWidget';

export default function OverviewTab({
  employee,
  totalLeaveRemaining = 0,
  monthAttendance = [],
  latestPayroll = null,
  pendingTasksCount = 0,
  leaveRequests = [],
  expenses = [],
  payrolls = [],
  onNavigateTab,
  onDownloadPayslip,
  isLoading = false,
}) {
  const currentYear = new Date().getFullYear();

  // Fetch team calendar to determine who is out of office today
  const { data: approvedLeaves = [] } = useQuery({
    queryKey: ['employee-overview-leave-calendar', currentYear],
    queryFn: async () => {
      try {
        const res = await leaveApi.getLeaveCalendar(currentYear);
        return Array.isArray(res) ? res : res?.data || [];
      } catch (err) {
        return [];
      }
    },
  });

  const onLeaveToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return approvedLeaves.filter((req) => {
      const isApproved = req.status === 'APPROVED' || req.status === 'approved';
      if (!isApproved) return false;
      const start = new Date(req.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });
  }, [approvedLeaves]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Spotlight Metric KPIs Strip */}
      <EmployeeMetricsGrid
        totalLeaveRemaining={totalLeaveRemaining}
        monthAttendance={monthAttendance}
        latestPayroll={latestPayroll}
        pendingTasksCount={pendingTasksCount}
        onNavigateTab={onNavigateTab}
        isLoading={isLoading}
      />

      {/* 2. High-Frequency Actions */}
      <EmployeeQuickActions onNavigateTab={onNavigateTab} />

      {/* 3. Main Content Responsive Grid (2 cols left, 1 col right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Requests & Employment Overview (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <EmployeeRecentActivityCard
            leaveRequests={leaveRequests}
            expenses={expenses}
            payrolls={payrolls}
            onNavigateTab={onNavigateTab}
            onDownloadPayslip={onDownloadPayslip}
          />

          <EmployeeProfileSummaryCard
            employee={employee}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* Right Column: Workplace Pulse Sidebar (1 col) */}
        <div className="space-y-6">
          <OutOfOfficeWidget onLeaveList={onLeaveToday} />
          <CelebrationsWidget />
          <UpcomingHolidaysWidget />
        </div>
      </div>
    </div>
  );
}

