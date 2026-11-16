import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListTodo, Check } from "lucide-react";
import { TASK_STATUS_CONFIG, normalizeTaskStatus } from "@/constants/taskStatus";
import { priorityConfig, getDueBadge } from "./taskManager.utils.jsx";

export default function TaskListView({
  filteredTasks = [],
  onSelectTask,
  onUpdateStatus,
  selectedTaskIds = [],
  onToggleSelectTask,
  onToggleSelectAll,
}) {
  const isAllSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id));

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                    isAllSelected
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 hover:border-slate-400 bg-white"
                  }`}
                  title={isAllSelected ? "Deselect all" : "Select all"}
                >
                  {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </button>
              </th>
              <th className="py-3 px-4">Task & Workstream</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Assignee</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const statusConf = TASK_STATUS_CONFIG[normalizeTaskStatus(task.status)];
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const isSelected = selectedTaskIds.includes(task.id);

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                    isSelected ? "bg-slate-50/90" : ""
                  }`}
                >
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSelectTask(task.id)}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 group-hover:border-slate-400 bg-white"
                      }`}
                      title={isSelected ? "Deselect task" : "Select task"}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-slate-950">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-xs">
                        {task.description || "No description"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {task.projectName}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {task.assigned_to ? task.assigned_to.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span className="font-medium text-slate-700 truncate max-w-[120px]">
                        {task.assigned_to || "Unassigned"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priority.badge}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getDueBadge(task.due_date, task.status)}
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={normalizeTaskStatus(task.status)}
                      onValueChange={(val) => onUpdateStatus(task, val)}
                    >
                      <SelectTrigger className={`h-7 text-xs border rounded-lg font-medium w-32 ${statusConf.color}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        {Object.entries(TASK_STATUS_CONFIG).map(([stKey, stVal]) => (
                          <SelectItem key={stKey} value={stKey} className="text-xs">
                            {stVal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectTask(task)}
                      className="h-7 text-xs text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              );
            })}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">No tasks match your criteria</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search keywords</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
