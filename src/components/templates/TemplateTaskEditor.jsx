import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, CheckCircle2, Clock } from "lucide-react";
import { TASK_OWNER_ROLES } from "@/constants/onboardingTaskTypes";
import TaskInputFieldConfig from "./TaskInputFieldConfig";

export default function TemplateTaskEditor({
  open,
  onClose,
  newTask,
  onChange,
  editingTaskIndex,
  onSave,
  isUploadingTemplate,
  onTemplateUpload,
  onRemoveTemplate,
}) {
  const isEditing = editingTaskIndex !== null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] flex flex-col p-0 gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                  {isEditing
                    ? `Edit Activity #${editingTaskIndex + 1}: ${newTask.title || "Untitled"}`
                    : "Add Onboarding Activity"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Configure activity requirements, role ownership, due dates, and response input fields.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body / Scrollable Form Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4.5 bg-slate-50/30 flex-1">
            {/* 1. Activity Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="text-xs font-semibold text-slate-700">
                Activity / Task Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="e.g. Upload Signed Offer Letter, Confirm Bank Details, or Select Hardware"
                value={newTask.title}
                onChange={(e) => onChange("title", e.target.value)}
                required
                className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-lg px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs"
              />
            </div>

            {/* 2. Assigned Role & Due Offset Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Assigned Owner Role <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={newTask.assignedRole}
                  onValueChange={(val) => onChange("assignedRole", val)}
                >
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3 focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-2xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value={TASK_OWNER_ROLES.EMPLOYEE}>Employee (New Hire)</SelectItem>
                    <SelectItem value={TASK_OWNER_ROLES.MANAGER}>Manager / Team Lead</SelectItem>
                    <SelectItem value={TASK_OWNER_ROLES.HR_ADMIN}>HR Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-due-offset" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Due Offset (Days from Hire)</span>
                </Label>
                <Input
                  id="task-due-offset"
                  type="number"
                  min="1"
                  max="365"
                  value={newTask.deadline_days}
                  onChange={(e) => onChange("deadline_days", Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 text-xs bg-white border-slate-200 rounded-lg px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* 3. Description / Guidance */}
            <div className="space-y-1.5">
              <Label htmlFor="task-description" className="text-xs font-semibold text-slate-700">
                Instructions / Guidance for the Assignee
              </Label>
              <Textarea
                id="task-description"
                placeholder="Provide instructions, helpful links, or guidance for completing this task..."
                value={newTask.description}
                onChange={(e) => onChange("description", e.target.value)}
                rows={2}
                className="text-xs bg-white border-slate-200 rounded-lg p-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 placeholder:text-slate-400 transition-all shadow-2xs resize-none"
              />
            </div>

            {/* 4. Input Field Selection & Configuration Section */}
            <TaskInputFieldConfig
              task={newTask}
              onChange={onChange}
              isUploadingTemplate={isUploadingTemplate}
              onTemplateUpload={onTemplateUpload}
              onRemoveTemplate={onRemoveTemplate}
            />
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t border-slate-100 bg-white shrink-0 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploadingTemplate || !newTask.title?.trim()}
              className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isEditing ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Save Activity Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Activity to Template</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
