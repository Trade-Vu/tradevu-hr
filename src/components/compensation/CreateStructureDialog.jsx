import React, { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, SlidersHorizontal } from "lucide-react";

export const ALLOWANCE_TYPES = [
  "basic",
  "housing",
  "transport",
  "meal",
  "utility",
  "entertainment",
  "thirteenth_month",
  "other",
];

export const ALLOWANCE_MODES = ["fixed", "percentage"];

const emptyAllowance = () => ({
  type: "housing",
  mode: "fixed",
  value: 0,
  taxable: true,
});

export const emptyStructureForm = () => ({
  name: "",
  departmentId: "",
  payGrade: "",
  effectiveDate: new Date().toISOString().slice(0, 10),
  basicSalary: "",
  allowances: [],
  status: "DRAFT",
});

export default function CreateStructureDialog({
  open,
  onOpenChange,
  departments = [],
  onSubmit,
  isPending = false,
}) {
  const [form, setForm] = useState(emptyStructureForm());

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setForm(emptyStructureForm());
    }
    onOpenChange(isOpen);
  };

  const addAllowanceRow = () => {
    setForm((prev) => ({
      ...prev,
      allowances: [...prev.allowances, emptyAllowance()],
    }));
  };

  const updateAllowanceRow = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      allowances: prev.allowances.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const removeAllowanceRow = (index) => {
    setForm((prev) => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.basicSalary) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Create Compensation Structure
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Define basic salary, pay grade, and recurring allowances.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Structure Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Senior Engineering Band"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                Department <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Select
                value={form.departmentId || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, departmentId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d._id || d.id} value={d._id || d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">
                Pay Grade <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                value={form.payGrade}
                onChange={(e) => setForm({ ...form, payGrade: e.target.value })}
                placeholder="e.g. L4, Band 3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Effective Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) =>
                setForm({ ...form, effectiveDate: e.target.value })
              }
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Label className="text-xs font-semibold text-slate-700">
              Monthly Basic Salary <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.basicSalary}
              onChange={(e) =>
                setForm({ ...form, basicSalary: e.target.value })
              }
              placeholder="0.00"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-800">
                  Allowances
                </h4>
                <p className="text-[11px] text-slate-500">
                  Add optional fixed amounts or percentage-based allowances.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addAllowanceRow}
                className="h-8 text-xs border-slate-200 text-slate-700 hover:text-blue-600"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Allowance
              </Button>
            </div>

            {form.allowances.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No allowances added yet. Click &quot;Add Allowance&quot; to configure.
              </div>
            ) : (
              <div className="space-y-2.5">
                {form.allowances.map((a, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60"
                  >
                    <Select
                      value={a.type}
                      onValueChange={(v) => updateAllowanceRow(idx, "type", v)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWANCE_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={a.mode}
                      onValueChange={(v) => updateAllowanceRow(idx, "mode", v)}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWANCE_MODES.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {m === "fixed" ? "Fixed" : "% of basic"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-8 text-xs bg-white"
                      value={a.value}
                      onChange={(e) =>
                        updateAllowanceRow(
                          idx,
                          "value",
                          Number(e.target.value) || 0
                        )
                      }
                    />

                    <div
                      className="flex items-center gap-1.5 px-1 cursor-pointer"
                      title="Taxable allowance"
                    >
                      <Checkbox
                        id={`taxable-${idx}`}
                        checked={a.taxable}
                        onCheckedChange={(c) =>
                          updateAllowanceRow(idx, "taxable", !!c)
                        }
                      />
                      <label
                        htmlFor={`taxable-${idx}`}
                        className="text-[11px] text-slate-600 select-none cursor-pointer"
                      >
                        Taxable
                      </label>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => removeAllowanceRow(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500">
              Only Active structures can be assigned to employees.
            </p>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.name || !form.basicSalary}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? "Saving..." : "Save Structure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
