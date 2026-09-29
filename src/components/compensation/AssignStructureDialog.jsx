import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, AlertCircle } from "lucide-react";

export default function AssignStructureDialog({
  open,
  onOpenChange,
  targetEmployee,
  activeStructures = [],
  onSubmit,
  isPending = false,
}) {
  const [form, setForm] = useState({
    structureId: "",
    overrideBasicSalary: "",
    reason: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        structureId: "",
        overrideBasicSalary: "",
        reason: "",
      });
    }
  }, [open, targetEmployee]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.structureId) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Assign Compensation Structure
              </DialogTitle>
              {targetEmployee && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Assigning to <span className="font-medium text-slate-700">{targetEmployee.fullName}</span> ({targetEmployee.employeeCode || "No Code"})
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Structure <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.structureId}
              onValueChange={(v) => setForm({ ...form, structureId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an active structure" />
              </SelectTrigger>
              <SelectContent>
                {activeStructures.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                    {s.payGrade ? ` (${s.payGrade})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeStructures.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200/60 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>No active structures yet — mark one as Active first.</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Override Basic Salary <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.overrideBasicSalary}
              onChange={(e) =>
                setForm({ ...form, overrideBasicSalary: e.target.value })
              }
              placeholder="Leave blank to use structure default"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Reason <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Onboarding, Promotion, Annual review"
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.structureId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? "Assigning..." : "Assign Structure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
