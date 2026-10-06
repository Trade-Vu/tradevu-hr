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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { ALLOWANCE_TYPES, ALLOWANCE_MODES } from "./CreateStructureDialog";

const emptyAllowance = () => ({
  type: "housing",
  mode: "fixed",
  value: 0,
  taxable: true,
});

export default function EditStructureDialog({
  structure,
  open,
  onOpenChange,
  departments = [],
  onSubmit,
  isPending = false,
}) {
  const [form, setForm] = useState({
    name: "",
    departmentId: "",
    payGrade: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    basicSalary: "",
    allowances: [],
    status: "ACTIVE",
  });

  useEffect(() => {
    if (structure && open) {
      setForm({
        name: structure.name || "",
        departmentId: structure.departmentId?._id || structure.departmentId || "",
        payGrade: structure.payGrade || "",
        effectiveDate: structure.effectiveDate
          ? new Date(structure.effectiveDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        basicSalary: structure.components?.basicSalary ?? "",
        allowances: structure.components?.allowances
          ? JSON.parse(JSON.stringify(structure.components.allowances))
          : [],
        status: structure.status || "ACTIVE",
      });
    }
  }, [structure, open]);

  const addAllowanceRow = () => {
    setForm((prev) => ({
      ...prev,
      allowances: [...prev.allowances, emptyAllowance()],
    }));
  };

  const updateAllowanceRow = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.allowances];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, allowances: next };
    });
  };

  const removeAllowanceRow = (index) => {
    setForm((prev) => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.basicSalary === "") return;

    const payload = {
      name: form.name,
      departmentId: form.departmentId || undefined,
      payGrade: form.payGrade || undefined,
      effectiveDate: form.effectiveDate,
      components: {
        basicSalary: Number(form.basicSalary) || 0,
        allowances: (form.allowances || []).map((a) => ({
          type: a.type,
          mode: a.mode,
          value: Number(a.value) || 0,
          taxable: Boolean(a.taxable),
        })),
      },
      status: form.status,
    };

    onSubmit(payload);
  };

  const basicNum = Number(form.basicSalary) || 0;
  const allowancesTotal = (form.allowances || []).reduce((sum, a) => {
    const val = Number(a.value) || 0;
    return sum + (a.mode === "percentage" ? (basicNum * val) / 100 : val);
  }, 0);
  const totalMonthly = basicNum + allowancesTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="w-5 h-5 text-blue-600" />
            Edit Compensation Structure
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-700">
                Structure Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-payGrade" className="text-xs font-semibold text-slate-700">
                Pay Grade
              </Label>
              <Input
                id="edit-payGrade"
                value={form.payGrade}
                onChange={(e) => setForm({ ...form, payGrade: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Department</Label>
              <Select
                value={form.departmentId || "all"}
                onValueChange={(val) =>
                  setForm({ ...form, departmentId: val === "all" ? "" : val })
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-effectiveDate" className="text-xs font-semibold text-slate-700">
                Effective Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-effectiveDate"
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-basicSalary" className="text-xs font-semibold text-slate-700">
              Basic Salary (Monthly) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-basicSalary"
              type="number"
              min="0"
              step="any"
              value={form.basicSalary}
              onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
              required
              className="text-xs font-semibold text-emerald-700"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Allowances</h4>
                <p className="text-[11px] text-slate-500">
                  Fixed or basic-salary-percentage based additions.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllowanceRow}
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Allowance
              </Button>
            </div>

            {form.allowances.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No allowances attached to this structure yet.
              </p>
            ) : (
              <div className="space-y-2">
                {form.allowances.map((allowance, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap md:flex-nowrap items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200"
                  >
                    <Select
                      value={allowance.type}
                      onValueChange={(val) => updateAllowanceRow(idx, "type", val)}
                    >
                      <SelectTrigger className="w-36 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWANCE_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={allowance.mode}
                      onValueChange={(val) => updateAllowanceRow(idx, "mode", val)}
                    >
                      <SelectTrigger className="w-32 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWANCE_MODES.map((m) => (
                          <SelectItem key={m} value={m} className="capitalize">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Value"
                      value={allowance.value}
                      onChange={(e) => updateAllowanceRow(idx, "value", e.target.value)}
                      className="w-28 text-xs bg-white font-medium"
                    />

                    <div className="flex items-center gap-1.5 px-2">
                      <Checkbox
                        id={`edit-taxable-${idx}`}
                        checked={allowance.taxable}
                        onCheckedChange={(v) => updateAllowanceRow(idx, "taxable", Boolean(v))}
                      />
                      <Label htmlFor={`edit-taxable-${idx}`} className="text-[11px] text-slate-600">
                        Taxable
                      </Label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllowanceRow(idx)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto h-8 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg bg-blue-50/70 border border-blue-100 p-3 space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Basic Salary:</span>
              <span className="font-semibold text-slate-900">{basicNum.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Allowances Total:</span>
              <span className="font-semibold text-slate-900">{allowancesTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-blue-900 pt-1 border-t border-blue-200/60">
              <span>Estimated Monthly Package:</span>
              <span>{totalMonthly.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-slate-700">Status</Label>
            <Select
              value={form.status}
              onValueChange={(val) => setForm({ ...form, status: val })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active (Assign to employees)</SelectItem>
                <SelectItem value="INACTIVE">Inactive (Disabled)</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {isPending ? "Updating..." : "Update Structure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
