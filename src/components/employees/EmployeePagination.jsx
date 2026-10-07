import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EmployeePagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50, 100],
}) {
  const [jumpPage, setJumpPage] = useState('');

  if (totalCount === 0) return null;

  const startEntry = (currentPage - 1) * limit + 1;
  const endEntry = Math.min(currentPage * limit, totalCount);

  // Generate page numbers with ellipsis window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      // Middle window around currentPage
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      // Always include last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage('');
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mt-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs sm:text-sm">
      {/* Left: Entries Counter & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-500 w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing <span className="font-semibold text-slate-900">{startEntry}</span> to{' '}
          <span className="font-semibold text-slate-900">{endEntry}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalCount}</span> employees
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Rows per page:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => onLimitChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-18 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-md">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis-start' || p === 'ellipsis-end') {
              return (
                <span
                  key={`${p}-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-slate-400"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <Button
                key={p}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-[32px] px-2.5 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-xs'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white'
                }`}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>

        {/* Direct Jump Input if more than 5 pages */}
        {totalPages > 5 && (
          <form onSubmit={handleJumpSubmit} className="hidden lg:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-400">Go to:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              placeholder="#"
              className="w-11 h-8 text-center text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </form>
        )}
      </div>
    </div>
  );
}
