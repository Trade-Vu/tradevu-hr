import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EmployeeList from './EmployeeList';
import FilterDropdown from '@/components/ui/FilterDropdown';

export const employmentStatusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROBATION', label: 'Probation' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'PENDING_ONBOARDING', label: 'Pending Onboarding' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RESIGNED', label: 'Resigned' },
];

export default function WorkforceOverviewCard({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  paginatedData,
  loadingPaginated,
  isFetching,
  page,
  setPage,
  limit,
  onOpenDetail,
}) {
  const currentEmployees = paginatedData?.employees || [];
  const totalCount = paginatedData?.totalCount || 0;
  const totalPages = paginatedData?.totalPages || 1;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white border shadow-xs rounded-xl border-slate-200/80">
      {/* Table Header: Search & Status Filter */}
      <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 font-heading">
              Workforce
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant personnel lookup and profile inspections
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 h-9 text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
              />
            </div>

            <FilterDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={employmentStatusOptions}
              placeholder="Status"
              showLeadingIcon={true}
              triggerClassName="w-36 sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="relative flex-1 min-h-[320px] max-h-[580px] overflow-y-auto custom-scrollbar">
        {(loadingPaginated || isFetching) && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none" />
        )}
        <EmployeeList
          employees={currentEmployees}
          isLoading={loadingPaginated && !paginatedData}
          onOpenDetail={onOpenDetail}
        />
      </div>

      {/* Table Footer: Responsive Pagination */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 sm:p-4 text-xs text-slate-500 border-t border-slate-100 gap-2 shrink-0 bg-slate-50/40">
          <span>
            Showing {Math.min((page - 1) * limit + 1, totalCount)} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} members
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 px-2.5 gap-1 text-xs rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </Button>

            <span className="text-xs text-slate-700 px-2 font-medium">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 px-2.5 gap-1 text-xs rounded-lg"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
