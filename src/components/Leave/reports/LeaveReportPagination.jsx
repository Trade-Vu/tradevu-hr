import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LeaveReportPagination({
  startIndex,
  endIndex,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  setPageSize,
  setCurrentPage,
  itemLabel = "records",
}) {
  if (totalCount === 0) return null;

  return (
    <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{" "}
          <span className="font-semibold text-slate-900">{endIndex}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalCount}</span> {itemLabel}
        </span>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => setPageSize(Number(val))}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 mr-1">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="h-8 px-2.5 text-xs bg-white"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 text-xs bg-white"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
