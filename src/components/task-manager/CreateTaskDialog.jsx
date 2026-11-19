import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateTaskDialog({
  open,
  onOpenChange,
  taskForm,
  setTaskForm,
  onSubmit,
  isPending,
  mappedProjects = [],
  employees = [],
  currentUserEmail = "",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-slate-200/80 shadow-2xl max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-slate-900">
            Create New Task
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Assign action items, set target delivery dates, and map to a project workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="t_title" className="text-xs font-semibold text-slate-700">
              Task Title
            </Label>
            <Input
              id="t_title"
              value={taskForm.title}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Finalize employee handbook revisions"
              className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t_desc" className="text-xs font-semibold text-slate-700">
              Description / Instructions
            </Label>
            <Textarea
              id="t_desc"
              value={taskForm.description}
              onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Provide details, acceptance criteria, or links..."
              rows={3}
              className="text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t_proj" className="text-xs font-semibold text-slate-700">
                Project Workspace
              </Label>
              <Select
                value={taskForm.project_id || "general"}
                onValueChange={(val) => setTaskForm((prev) => ({ ...prev, project_id: val }))}
              >
                <SelectTrigger id="t_proj" className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="General (No Project)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-56">
                  <SelectItem value="general" className="text-xs">
                    General Tasks
                  </SelectItem>
                  {mappedProjects
                    .filter((p) => !p.is_onboarding)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.project_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t_assigned" className="text-xs font-semibold text-slate-700">
                Assign To
              </Label>
              <Select
                value={taskForm.assigned_to}
                onValueChange={(val) => setTaskForm((prev) => ({ ...prev, assigned_to: val }))}
                required
              >
                <SelectTrigger id="t_assigned" className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-56">
                  {employees.map((emp) => {
                    const val = emp.fullName || emp.email || emp.full_name;
                    return (
                      <SelectItem key={emp._id || emp.id} value={val} className="text-xs">
                        {emp.fullName || emp.full_name || emp.email}
                      </SelectItem>
                    );
                  })}
                  {currentUserEmail && !employees.some((e) => e.email === currentUserEmail) && (
                    <SelectItem value={currentUserEmail} className="text-xs">
                      {currentUserEmail}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t_pri" className="text-xs font-semibold text-slate-700">
                Priority
              </Label>
              <Select
                value={taskForm.priority}
                onValueChange={(val) => setTaskForm((prev) => ({ ...prev, priority: val }))}
              >
                <SelectTrigger id="t_pri" className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg">
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

            <div className="space-y-1.5">
              <Label htmlFor="t_due" className="text-xs font-semibold text-slate-700">
                Due Date
              </Label>
              <Input
                id="t_due"
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, due_date: e.target.value }))}
                className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-lg border-slate-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm cursor-pointer"
            >
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

