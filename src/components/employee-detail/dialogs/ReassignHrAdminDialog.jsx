import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { isEmployeeEligibleForHrAdmin } from "../employeeDetailUtils";

export default function ReassignHrAdminDialog({
  open,
  onOpenChange,
  employee,
  employees = [],
  selectedHrAdminEmpId,
  setSelectedHrAdminEmpId,
  onConfirm,
  isPending,
}) {
  const targetEmp = employees.find(e => e.id === selectedHrAdminEmpId) || (selectedHrAdminEmpId === employee?.id ? employee : null);
  const isEligible = isEmployeeEligibleForHrAdmin(targetEmp);
  const isCurrentHr = targetEmp?.isHrAdmin || (selectedHrAdminEmpId === employee?.id && employee?.isHrAdmin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 text-indigo-700 bg-indigo-100 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Reassign HR Administrator</DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">Designate an employee as the organization's HR Admin</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3.5 rounded-lg border border-indigo-100 bg-indigo-50/50 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-indigo-950">
              <p className="font-semibold">Role Delegation & Eligibility Requirement</p>
              <p className="leading-relaxed">
                Only employees who are <strong>ACTIVE</strong> and have <strong>finished onboarding</strong> on the platform can be designated as HR Admin.
              </p>
              <p className="leading-relaxed text-indigo-800">
                Designating a new HR Admin grants full administrative privileges over departments, onboarding, workforce, and approvals. Any previous HR Admin will be safely transitioned back to standard employee permissions.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Select Eligible Employee</Label>
            <Select
              value={selectedHrAdminEmpId || ''}
              onValueChange={(val) => setSelectedHrAdminEmpId(val)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Choose an eligible employee" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map(emp => {
                  const isCurrentViewed = emp.id === employee?.id;
                  const isEmpHr = emp.isHrAdmin || (isCurrentViewed && employee?.isHrAdmin);
                  const isEmpEligible = isEmployeeEligibleForHrAdmin(emp);
                  const empStatus = (emp.employment_status || emp.employmentStatus || '').toUpperCase();
                  const empOnboarding = (emp.onboarding_status || emp.onboardingStatus || '').toUpperCase();

                  let badgeText = '';
                  let badgeClass = '';
                  if (isEmpHr) {
                    badgeText = 'Current HR Admin';
                    badgeClass = 'bg-slate-100 text-slate-500 border-slate-200';
                  } else if (empStatus !== 'ACTIVE') {
                    badgeText = empStatus || 'Inactive';
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  } else if (empOnboarding !== 'COMPLETED' && (emp.onboarding_progress ?? emp.onboardingProgress ?? 0) < 100) {
                    badgeText = 'Onboarding Incomplete';
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  } else {
                    badgeText = 'Eligible';
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  }

                  return (
                    <SelectItem key={emp.id} value={emp.id} disabled={isEmpHr || !isEmpEligible}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{emp.full_name || emp.fullName}</span>
                          <span className="text-xs text-slate-400">({emp.job_title || emp.jobTitle || 'Employee'})</span>
                          {isCurrentViewed && <span className="text-[10px] text-indigo-600 font-semibold">(This Profile)</span>}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Only active employees who have completed onboarding can be selected.
            </p>
          </div>

          {targetEmp && !isEligible && (
            <div className="p-3 text-xs border rounded-lg border-amber-200 bg-amber-50/70 text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>{targetEmp.full_name || targetEmp.fullName} is not eligible to be HR Admin.</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  To be assigned as HR Admin, the employee must be <strong>ACTIVE</strong> (current: {targetEmp.employment_status || targetEmp.employmentStatus || 'N/A'}) and have <strong>completed onboarding</strong> on the platform (current: {targetEmp.onboarding_status || targetEmp.onboardingStatus || 'Incomplete'}).
                </p>
              </div>
            </div>
          )}

          {targetEmp && isEligible && (
            <div className="p-3 text-xs border rounded-lg border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                You are designating <strong>{targetEmp.full_name || targetEmp.fullName}</strong> as the new HR Admin.
                <p className="mt-0.5 text-emerald-700">Verified: ACTIVE status & completed onboarding on platform.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="text-white bg-indigo-600 hover:bg-indigo-700"
            disabled={
              isPending ||
              !selectedHrAdminEmpId ||
              !isEligible ||
              isCurrentHr
            }
            onClick={() => {
              if (selectedHrAdminEmpId && isEligible) {
                onConfirm(selectedHrAdminEmpId);
              }
            }}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {isPending ? "Reassigning..." : "Confirm Reassignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
