import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Loader2, Paperclip, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { toTitleCase } from '@/lib/utils';
import { safeDate } from './ApprovalsUIComponents';

export default function TaskReviewDialog({
  open,
  onOpenChange,
  employee,
  completedTasks = [],
  onApproveTasks,
  isApproving = false,
}) {
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Auto-select all completed tasks whenever the dialog opens or task list updates
  useEffect(() => {
    if (open) {
      const allIds = completedTasks.map((t) => String(t.id || t._id)).filter(Boolean);
      setSelectedTaskIds(allIds);
    }
  }, [open, completedTasks]);

  const allSelected =
    completedTasks.length > 0 && selectedTaskIds.length === completedTasks.length;

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedTaskIds(completedTasks.map((t) => String(t.id || t._id)).filter(Boolean));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleTask = (taskId, checked) => {
    if (checked) {
      setSelectedTaskIds((prev) => [...prev, taskId]);
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleApprove = () => {
    if (selectedTaskIds.length === 0) return;
    const empId = employee?.id || employee?._id;
    onApproveTasks(
      {
        employeeId: empId,
        taskIds: selectedTaskIds,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden sm:rounded-2xl border-slate-200/80 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Review Completed Tasks
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Review submissions by <span className="font-semibold text-slate-700">{employee?.fullName}</span> before approving.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-0.5 font-semibold shrink-0">
              {completedTasks.length} Pending
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
          {/* Select all header bar */}
          {completedTasks.length > 1 && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50/90 rounded-lg border border-slate-200/60 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleToggleSelectAll}
                  aria-label="Select all tasks"
                />
                <span>Select all ({completedTasks.length})</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {selectedTaskIds.length} of {completedTasks.length} selected
              </span>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-2.5">
            {completedTasks.map((task) => {
              const taskId = String(task.id || task._id);
              const isChecked = selectedTaskIds.includes(taskId);
              const attachments = Array.isArray(task.attachmentUrls) ? task.attachmentUrls : [];

              return (
                <div
                  key={taskId}
                  onClick={() => handleToggleTask(taskId, !isChecked)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-50/30 border-indigo-200/80 shadow-xs'
                      : 'bg-white border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggleTask(taskId, Boolean(checked))}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {task.title}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0 bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0"
                      >
                        {toTitleCase(task.category || 'task')}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Completion notes */}
                    {task.notes && (
                      <div className="flex items-start gap-1.5 p-2 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 shadow-2xs">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <p className="italic">{task.notes}</p>
                      </div>
                    )}

                    {/* Attachments / Uploaded proofs */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {attachments.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200/60 transition-colors"
                          >
                            <Paperclip className="w-3 h-3 text-indigo-500" />
                            <span>Attachment {attachments.length > 1 ? `#${i + 1}` : ''}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Completed timestamp footer */}
                    {task.completedAt && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Completed on {safeDate(task.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isApproving}
            className="text-xs text-slate-500 hover:text-slate-700 active:scale-[0.98] transition-all duration-150"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApprove}
            disabled={isApproving || selectedTaskIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 ease-out text-white font-semibold text-xs px-4 py-2 shadow-sm rounded-lg flex items-center gap-1.5"
          >
            {isApproving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isApproving
                ? 'Approving...'
                : selectedTaskIds.length === completedTasks.length
                ? `Approve All (${selectedTaskIds.length})`
                : `Approve Selected (${selectedTaskIds.length})`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
