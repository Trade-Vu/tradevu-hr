import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function PromoteEmployeeDialog({
  open,
  onOpenChange,
  employee,
  departments = [],
  employeeClasses = [],
  onConfirm,
  isPending,
}) {
  const [form, setForm] = useState({
    jobTitle: '',
    departmentId: '',
    employeeClass: '',
    isHeadOfDepartment: false,
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (employee && open) {
      setForm({
        jobTitle: employee.job_title || '',
        departmentId: employee.department_id || '',
        employeeClass: employee.employeeClass || '',
        isHeadOfDepartment: false,
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [employee, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote Employee</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>New Job Title</Label>
            <Input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
            />
            {employee?.job_title && <p className="mt-1 text-xs text-slate-500">Current: {employee.job_title}</p>}
          </div>

          <div className="space-y-2">
            <Label>New Department</Label>
            <Select
              value={form.departmentId}
              onValueChange={(value) => setForm({ ...form, departmentId: value })}
            >
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employee?.department_name && <p className="mt-1 text-xs text-slate-500">Current: {employee.department_name}</p>}
          </div>

          <div className="space-y-2">
            <Label>New Class</Label>
            <Select
              value={form.employeeClass}
              onValueChange={(value) => setForm({ ...form, employeeClass: value })}
            >
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {employeeClasses.map((cls) => (
                  <SelectItem key={cls.value} value={cls.value}>{cls.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employee?.employeeClass && <p className="mt-1 text-xs text-slate-500">Current: {employee.employeeClass}</p>}
          </div>

          <div className="flex items-center mt-4 space-x-2">
            <Checkbox
              id="isHead"
              checked={form.isHeadOfDepartment}
              onCheckedChange={(checked) => setForm({ ...form, isHeadOfDepartment: checked })}
            />
            <label htmlFor="isHead" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Appoint as Head of Department
            </label>
          </div>

          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
            />
          </div>

          <Button
            onClick={() => {
              onConfirm({
                employeeId: employee?.id,
                newJobTitle: form.jobTitle || undefined,
                newDepartmentId: form.departmentId || undefined,
                newEmployeeClass: form.employeeClass || undefined,
                isHeadOfDepartment: form.isHeadOfDepartment,
                effectiveDate: form.effectiveDate,
              });
            }}
            disabled={isPending || (!form.jobTitle && !form.employeeClass)}
            className="w-full text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {isPending ? 'Requesting...' : 'Confirm Promotion'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
