import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserCheck, Filter, Kanban, FolderKanban } from "lucide-react";

export default function TaskControlBar({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  onlyMyTasks,
  setOnlyMyTasks,
  selectedProjectId,
  setSelectedProjectId,
  selectedPriority,
  setSelectedPriority,
  mappedProjects = [],
  allTasksCount = 0,
}) {
  const hasActiveFilters =
    selectedProjectId !== "all" || selectedPriority !== "all" || searchQuery || onlyMyTasks;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs p-3 sm:p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60 w-fit">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("projects")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === "projects"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects ({mappedProjects.length})</span>
          </button>
        </div>

        {/* Right: Search & "My Tasks" */}
        <div className="flex items-center gap-2.5 flex-1 lg:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search tasks, deliverables, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <Button
            variant={onlyMyTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={`h-9 px-3 text-xs font-semibold rounded-lg shrink-0 gap-1.5 cursor-pointer ${
              onlyMyTasks
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Tasks</span>
          </Button>
        </div>
      </div>

      {/* Secondary Filter Rail */}
      <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <div className="w-48 sm:w-56">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="All Workspaces / Projects" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-72">
              <SelectItem value="all" className="text-xs font-medium">
                All Projects & Initiatives ({allTasksCount})
              </SelectItem>
              {mappedProjects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id} className="text-xs">
                  {proj.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
              <SelectItem value="all" className="text-xs font-medium">
                All Priorities
              </SelectItem>
              <SelectItem value="urgent" className="text-xs text-red-600 font-semibold">
                Urgent
              </SelectItem>
              <SelectItem value="high" className="text-xs text-amber-600 font-semibold">
                High
              </SelectItem>
              <SelectItem value="medium" className="text-xs text-blue-600 font-medium">
                Medium
              </SelectItem>
              <SelectItem value="low" className="text-xs text-slate-600 font-medium">
                Low
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSelectedProjectId("all");
              setSelectedPriority("all");
              setSearchQuery("");
              setOnlyMyTasks(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-900 underline font-medium ml-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

