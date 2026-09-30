import React from "react";
import { Search, Grid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeeDirectoryFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
}) {
  return (
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
  );
}
