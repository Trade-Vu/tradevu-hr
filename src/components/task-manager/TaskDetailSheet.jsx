import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FolderKanban,
  Calendar,
  Sparkles,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { TASK_STATUS_CONFIG, normalizeTaskStatus } from "@/constants/taskStatus";
import { priorityConfig } from "./taskManager.utils";

export default function TaskDetailSheet({
  selectedTask,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteTask,
  isDeleting = false,
}) {
  if (!selectedTask) return null;

  return (
    <Sheet open={Boolean(selectedTask)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-white border-l border-slate-200/90 shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200/80 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedTask.projectName}</span>
            </div>

            <Badge
              className={`rounded-full text-[10px] font-semibold border ${
                priorityConfig[selectedTask.priority]?.badge || priorityConfig.medium.badge
              }`}
            >
              {selectedTask.priority?.toUpperCase()}
            </Badge>
          </div>

          <h2 className="font-heading text-xl font-bold text-slate-900 leading-tight">
            {selectedTask.title}
          </h2>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Priority Interactive Selectors */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/90 p-4 rounded-xl border border-slate-200/70">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Workflow Status
              </label>
              <Select
                value={normalizeTaskStatus(selectedTask.status)}
                onValueChange={(val) => onUpdateStatus(selectedTask, val)}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  {Object.entries(TASK_STATUS_CONFIG).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      {cfg.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Priority Level
              </label>
              <Select
                value={selectedTask.priority}
                onValueChange={(val) => onUpdatePriority(selectedTask, val)}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="urgent" className="text-xs text-red-600 font-semibold">Urgent</SelectItem>
                  <SelectItem value="high" className="text-xs text-amber-600 font-semibold">High</SelectItem>
                  <SelectItem value="medium" className="text-xs text-blue-600 font-medium">Medium</SelectItem>
                  <SelectItem value="low" className="text-xs text-slate-600 font-medium">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment & Due Date Rail */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Assigned To
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  {selectedTask.assigned_to ? selectedTask.assigned_to.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedTask.assigned_to || "Unassigned"}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Target Due Date
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-800">
                  {selectedTask.due_date
                    ? new Date(selectedTask.due_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "No deadline specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Task Brief & Instructions
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[90px]">
              {selectedTask.description || <span className="text-slate-400 italic">No instructions provided.</span>}
            </div>
          </div>

          {/* Interactive Activity Submissions (Onboarding Forms/Files) */}
          {selectedTask.is_onboarding && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Activity Submissions & Templates</span>
                </h4>
                {selectedTask.assignedRole && (
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                    Role: {selectedTask.assignedRole}
                  </Badge>
                )}
              </div>

              {selectedTask.templateUrl && (
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-blue-950 block truncate">
                        {selectedTask.templateName || "Official Form Template"}
                      </span>
                      <span className="text-[10px] text-blue-600">Provided by HR for completion</span>
                    </div>
                  </div>
                  <a
                    href={selectedTask.templateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 ml-2"
                  >
                    Download <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedTask.responseValue && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Employee Response / Selection
                  </span>
                  <p className="text-xs font-semibold text-emerald-950">
                    {Array.isArray(selectedTask.responseValue)
                      ? selectedTask.responseValue.join(", ")
                      : String(selectedTask.responseValue)}
                  </p>
                </div>
              )}

              {/* Submission history with metadata */}
              {((selectedTask.submissions && selectedTask.submissions.length > 0) ||
                (selectedTask.attachmentUrls && selectedTask.attachmentUrls.length > 0)) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Uploaded Document Evidence (
                    {selectedTask.submissions?.length || selectedTask.attachmentUrls?.length || 0}
                    )
                  </span>
                  <div className="space-y-1.5">
                    {(selectedTask.submissions && selectedTask.submissions.length > 0
                      ? selectedTask.submissions
                      : (selectedTask.attachmentUrls || []).map((url, i) => ({
                          fileName: `Document Submission #${i + 1}`,
                          fileUrl: url,
                          uploadedBy: selectedTask.assigned_to || "Employee",
                        }))
                    ).map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-800 block truncate">{sub.fileName}</span>
                            <span className="text-[10px] text-slate-400 block">
                              Uploaded by {sub.uploadedBy || "Employee"}{" "}
                              {sub.uploadedAt ? `• ${new Date(sub.uploadedAt).toLocaleDateString()}` : ""}
                            </span>
                          </div>
                        </div>
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 text-xs shrink-0 ml-2"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3">
          {!selectedTask.is_onboarding ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteTask(selectedTask)}
              disabled={isDeleting}
              className="h-8 text-xs text-red-600 hover:bg-red-50 border-red-200/80 gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Managed by Onboarding track</span>
          )}

          <Button
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm cursor-pointer ml-auto"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

