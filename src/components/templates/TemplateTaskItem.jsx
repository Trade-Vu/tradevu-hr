import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, Download, Sliders } from "lucide-react";
import {
  TASK_INPUT_TYPES,
  TASK_INPUT_TYPE_LABELS,
  TASK_OWNER_ROLES,
  TASK_OWNER_ROLE_LABELS,
} from "@/constants/onboardingTaskTypes";

export default function TemplateTaskItem({
  task,
  index,
  isBeingEdited,
  onEdit,
  onRemove,
}) {
  return (
    <div
      className={`p-4 rounded-xl border shadow-2xs space-y-2.5 transition-all ${
        isBeingEdited
          ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-200"
          : "bg-slate-50/90 border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-slate-900">{task.title}</span>
            {isBeingEdited && (
              <Badge className="text-[10px] bg-indigo-600 text-white font-bold animate-pulse">
                Currently Editing
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700">
              Due in {task.deadline_days} days
            </Badge>
            <Badge
              className={`text-[10px] font-semibold border ${
                task.assignedRole === TASK_OWNER_ROLES.EMPLOYEE
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : task.assignedRole === TASK_OWNER_ROLES.MANAGER
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {TASK_OWNER_ROLE_LABELS[task.assignedRole] || task.assignedRole}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-medium">
              Input: {TASK_INPUT_TYPE_LABELS[task.taskType] || task.taskType}
            </Badge>
            {task.isUploadRequired && (
              <Badge className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                Upload Required
              </Badge>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-slate-600 leading-relaxed mb-1.5">{task.description}</p>
          )}

          {/* Input field details preview */}
          {task.inputConfig?.label && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-1">
              <Sliders className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Field Label:</span>
              <span className="font-semibold text-slate-900">"{task.inputConfig.label}"</span>
              {task.inputConfig.subType && (
                <span className="text-[10px] text-slate-400 capitalize">({task.inputConfig.subType})</span>
              )}
            </div>
          )}

          {task.taskType === TASK_INPUT_TYPES.MULTI_SELECT && task.inputConfig?.options && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 mt-1">
              <span>Choices:</span>
              {task.inputConfig.options.map((opt, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-medium">
                  {opt}
                </span>
              ))}
            </div>
          )}

          {/* Attached Template details */}
          {task.templateUrl && (
            <div className="mt-2 p-2 rounded-lg bg-indigo-50/70 border border-indigo-200/70 text-xs text-indigo-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold truncate">
                  Attached Template: {task.templateName || "Document Form"}
                </span>
              </div>
              <a
                href={task.templateUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs shrink-0 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Preview</span>
              </a>
            </div>
          )}
        </div>

        {/* Action buttons: Edit & Delete */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(index)}
            className="h-8 px-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 cursor-pointer"
            title="Edit this task"
          >
            <Edit className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            <span>Edit</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-8 w-8 text-slate-400 hover:text-red-600 cursor-pointer"
            title="Remove task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
