import React from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, XCircle, Paperclip, Calendar } from "lucide-react";
import { calculateWorkingDays } from "@/lib/leaveDays";
import LeaveHandoverFormSection from "@/components/Leave/LeaveHandoverFormSection";
import { useLeaveRequestDialogForm } from "@/components/Leave/useLeaveRequestDialogForm";

export default function LeaveRequestDialog({
  open = false,
  onOpenChange,
  editingLeave = null,
  employees = [],
  leaveTypes = [],
  publicHolidays = [],
  onSubmit,
  isSubmitting = false,
}) {
  const {
    formData,
    setFormData,
    uploadingDoc,
    selectedType,
    hasNoticePeriod,
    noticeDays,
    minAllowedDate,
    addSelectedDate,
    removeSelectedDate,
    handleDocUpload,
  } = useLeaveRequestDialogForm({
    open,
    editingLeave,
    leaveTypes,
    publicHolidays,
  });

  const isHandoverCompulsory = Boolean(
    selectedType?.requiresHandover || selectedType?.handoverRequirement === "COMPULSORY"
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLeave) {
      onSubmit(formData, editingLeave);
      return;
    }

    if (!formData.employee_id) {
      toast.error("Select the employee this leave request is for.");
      return;
    }
    if (!formData.leave_type) {
      toast.error("Select a leave type.");
      return;
    }

    if (!editingLeave && noticeDays > 0 && minAllowedDate) {
      if (formData.useMultipleDates) {
        const invalidDate = formData.selectedDates.find((d) => d < minAllowedDate);
        if (invalidDate) {
          toast.error(`Date ${invalidDate} is within the ${noticeDays}-day notice period. Earliest date allowed is ${minAllowedDate}.`);
          return;
        }
      } else {
        if (formData.start_date < minAllowedDate) {
          toast.error(`Start date cannot be earlier than ${minAllowedDate} due to the ${noticeDays}-day notice period.`);
          return;
        }
      }
    }

    if (isHandoverCompulsory) {
      if (!formData.relief_officer_id) {
        toast.error("Please select a Relief Officer from the department for this request.");
        return;
      }
      if (!formData.handover_note?.trim() && !formData.handover_note_url) {
        toast.error("Handover note is required for this leave type.");
        return;
      }
    }

    onSubmit(formData, null);
  };

  const targetEmp = employees.find((e) => e.id === formData.employee_id || e._id === formData.employee_id);
  const targetDeptId = targetEmp?.departmentId?._id || targetEmp?.departmentId?.id || targetEmp?.departmentId;
  const targetDeptName = targetEmp?.departmentId?.name || targetEmp?.department?.name || "";
  const deptColleagues = employees.filter((e) => {
    const empId = e.id || e._id;
    if (empId === formData.employee_id) return false;
    const empDeptId = e.departmentId?._id || e.departmentId?.id || e.departmentId;
    if (!targetDeptId || !empDeptId) return false;
    return empDeptId.toString() === targetDeptId.toString();
  });
  const selectableCols = deptColleagues.length > 0
    ? deptColleagues
    : employees.filter((e) => (e.id || e._id) !== formData.employee_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl shadow-xl rounded-2xl border-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLeave ? "Edit" : "Create"} Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, employee_id: value }))}
              disabled={!!editingLeave}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className="shadow-lg rounded-xl border-slate-100">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name} - {emp.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, leave_type: value }))}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="shadow-lg rounded-xl border-slate-100">
                {leaveTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!editingLeave && hasNoticePeriod && noticeDays > 0 && (
              <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">{noticeDays}-Day Notice Period Required:</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Must be booked at least {noticeDays} day(s) in advance. Earliest start date available is{" "}
                    <strong className="font-semibold underline">
                      {minAllowedDate ? format(new Date(minAllowedDate + "T00:00:00"), "MMM d, yyyy") : ""}
                    </strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHalfDayDialog"
                checked={formData.isHalfDay}
                onChange={(e) => {
                  const isHalf = e.target.checked;
                  let tDays = 0;
                  let newEndDate = formData.end_date;
                  if (isHalf && !formData.useMultipleDates) newEndDate = formData.start_date;
                  if (formData.useMultipleDates) {
                    tDays = formData.selectedDates.length * (isHalf ? 0.5 : 1);
                  } else {
                    tDays = calculateWorkingDays(formData.start_date, newEndDate, publicHolidays) * (isHalf ? 0.5 : 1);
                  }
                  setFormData({ ...formData, isHalfDay: isHalf, end_date: newEndDate, total_days: tDays });
                }}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isHalfDayDialog">Half-Day</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useMultipleDatesDialog"
                checked={formData.useMultipleDates}
                onChange={(e) => {
                  const useMultiple = e.target.checked;
                  let tDays = 0;
                  if (useMultiple) {
                    tDays = formData.selectedDates.length * (formData.isHalfDay ? 0.5 : 1);
                  } else {
                    tDays = calculateWorkingDays(formData.start_date, formData.end_date, publicHolidays) * (formData.isHalfDay ? 0.5 : 1);
                  }
                  setFormData({ ...formData, useMultipleDates: useMultiple, total_days: tDays });
                }}
                className="rounded border-slate-300"
              />
              <Label htmlFor="useMultipleDatesDialog">Multiple Dates</Label>
            </div>
          </div>

          {!formData.useMultipleDates ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  min={minAllowedDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const newEnd = formData.isHalfDay ? newStart : formData.end_date;
                    const days = calculateWorkingDays(newStart, newEnd, publicHolidays);
                    setFormData((prev) => ({
                      ...prev,
                      start_date: newStart,
                      end_date: newEnd,
                      total_days: prev.isHalfDay ? days * 0.5 : days,
                    }));
                  }}
                  required
                />
              </div>

              {!formData.isHalfDay && (
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date || minAllowedDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const days = calculateWorkingDays(formData.start_date, newEnd, publicHolidays);
                      setFormData((prev) => ({
                        ...prev,
                        end_date: newEnd,
                        total_days: prev.isHalfDay ? days * 0.5 : days,
                      }));
                    }}
                    required
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Selected Dates</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  id="dialogMultipleDateInput"
                  min={minAllowedDate}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const el = document.getElementById("dialogMultipleDateInput");
                    if (el?.value) {
                      addSelectedDate(el.value);
                      el.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.selectedDates.map((date) => (
                  <Badge key={date} variant="secondary" className="flex items-center gap-1">
                    {format(new Date(date), "MMM d, yyyy")}
                    <XCircle
                      className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-red-500"
                      onClick={() => removeSelectedDate(date)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Total Working Days</Label>
            <Input type="number" value={formData.total_days} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Provide a brief reason for the leave"
              rows={3}
              required
            />
          </div>

          <LeaveHandoverFormSection
            isCompulsory={isHandoverCompulsory}
            departmentName={targetDeptName}
            reliefOfficerId={formData.relief_officer_id}
            onReliefOfficerChange={(val) => setFormData((prev) => ({ ...prev, relief_officer_id: val }))}
            colleagues={selectableCols}
            handoverNote={formData.handover_note}
            onHandoverNoteChange={(val) => setFormData((prev) => ({ ...prev, handover_note: val }))}
            handoverNoteUrl={formData.handover_note_url}
            onHandoverNoteUrlChange={(val) => setFormData((prev) => ({ ...prev, handover_note_url: val }))}
          />

          <div className="space-y-2">
            <Label>Supporting Document</Label>
            <div className="flex items-center gap-3">
              <input type="file" id="dialogDocUpload" onChange={handleDocUpload} className="hidden" />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("dialogDocUpload")?.click()}
                disabled={uploadingDoc}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingDoc ? "Uploading..." : "Upload Document"}
              </Button>
              {formData.attachment_url && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Paperclip className="w-4 h-4" /> Attached
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
              {isSubmitting ? "Submitting..." : editingLeave ? "Update Request" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
