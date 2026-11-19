import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { FileText, Check } from "lucide-react";
import { priorityConfig, getDueBadge } from "./taskManager.utils.jsx";

export default function TaskCard({
  task,
  index,
  onSelectTask,
  isSelected = false,
  onToggleSelect,
}) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onSelectTask(task)}
          className={`group bg-white rounded-xl border p-3.5 select-none transition-all cursor-pointer flex flex-col gap-2.5 ${
            isSelected
              ? "border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/40 shadow-sm"
              : "border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300"
          } ${
            snapshot.isDragging
              ? "shadow-2xl scale-[1.02] border-slate-400 rotate-1 ring-1 ring-slate-900/10 z-50"
              : ""
          }`}
          style={provided.draggableProps.style}
        >
          {/* Top Meta: Checkbox, Source, & Priority */}
          <div className="flex items-center justify-between gap-1.5 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Multi-Select Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(task.id);
                }}
                className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 group-hover:border-slate-400 bg-white"
                }`}
                title={isSelected ? "Deselect task" : "Select task"}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </button>

              <span
                className={`px-1.5 py-0.5 rounded font-medium truncate max-w-[150px] uppercase tracking-wider ${
                  task.is_onboarding
                    ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {task.is_onboarding ? "Onboarding" : task.projectName}
              </span>
            </div>

            <span className={`px-1.5 py-0.5 rounded-full font-semibold border shrink-0 ${priority.badge}`}>
              {priority.label}
            </span>
          </div>

          {/* Task Title */}
          <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-slate-950">
            {task.title}
          </h4>

          {/* Task Description Preview */}
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Activity / Interactive Pill */}
          {task.taskType && task.taskType !== "checkbox" && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50/70 border border-blue-200/50 px-2 py-0.5 rounded-md w-fit">
              <FileText className="w-3 h-3 text-blue-600" />
              <span className="capitalize">{task.taskType.replace("_", " ")}</span>
            </div>
          )}

          {/* Bottom Footer: Due Date & Assignee Avatar */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
            {getDueBadge(task.due_date, task.status)}

            {task.assigned_to && (
              <div
                className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0"
                title={`Assigned to ${task.assigned_to}`}
              >
                {task.assigned_to.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
