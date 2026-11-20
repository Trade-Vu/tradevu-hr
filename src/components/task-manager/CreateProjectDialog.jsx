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

export default function CreateProjectDialog({
  open,
  onOpenChange,
  projectForm,
  setProjectForm,
  onSubmit,
  isPending,
  employees = [],
  currentUserEmail = "",
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-slate-200/80 shadow-2xl max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-slate-900">
            Create Project Workspace
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Spin up a trackable initiative with deliverables and team owners.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj_name" className="text-xs font-semibold text-slate-700">
              Project Name
            </Label>
            <Input
              id="proj_name"
              value={projectForm.project_name}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, project_name: e.target.value }))}
              placeholder="e.g. SOC2 Compliance Audit 2026"
              className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj_desc" className="text-xs font-semibold text-slate-700">
              Description
            </Label>
            <Textarea
              id="proj_desc"
              value={projectForm.description}
              onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Key goals, deliverables, and targets..."
              rows={3}
              className="text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj_mgr" className="text-xs font-semibold text-slate-700">
              Project Lead / Manager
            </Label>
            <Select
              value={projectForm.project_manager}
              onValueChange={(val) => setProjectForm((prev) => ({ ...prev, project_manager: val }))}
              required
            >
              <SelectTrigger id="proj_mgr" className="h-9 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-60">
                {employees.map((emp) => {
                  const val = emp.email || emp._id || emp.id;
                  const label = emp.fullName || emp.full_name || emp.email;
                  return (
                    <SelectItem key={emp._id || emp.id} value={val} className="text-xs">
                      {label}
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
              {isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

