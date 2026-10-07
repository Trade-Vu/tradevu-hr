import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Upload, Paperclip, XCircle, Calendar, Briefcase } from "lucide-react";
import LeaveHandoverFormSection from "@/components/Leave/LeaveHandoverFormSection";
import { useLeaveOverviewForm } from "@/components/Leave/useLeaveOverviewForm";

export default function LeaveOverviewFormCard({
  isOpen = true,
  user,
  isAdmin = false,
  isPastLeave = false,
  employees = [],
  leaveTypes = [],
  leaveBalances = [],
  publicHolidays = [],
  onClose,
  onSuccess,
}) {
  const {
    formData,
    setFormData,
    uploadingFile,
    isSubmitting,
    hasNoticePeriod,
    noticeDays,
    minAllowedDate,
    applicantDeptName,
    selectableColleagues,
    isHandoverCompulsory,
    requiresAttachment,
    hasRequiredRequestData,
    handleDateChange,
    handleHalfDayToggle,
    handleMultipleDatesToggle,
    addSelectedDate,
    removeSelectedDate,
    handleFileUpload,
    handleSubmit,
    availableLeaveTypes,
    applicantEmployee,
    selectedBalance,
    applicantAllocatedDays,
  } = useLeaveOverviewForm({
    user,
    isAdmin,
    isPastLeave,
    employees,
    leaveTypes,
    leaveBalances,
    publicHolidays,
    onClose,
    onSuccess,
  });

  const displayLeaveTypes = applicantEmployee ? (availableLeaveTypes || []) : leaveTypes;

  const employeeClassificationLabel = React.useMemo(() => {
    if (!applicantEmployee) return null;
    const parts = [
      applicantEmployee.employmentType || applicantEmployee.employment_type,
      applicantEmployee.employeeClass || applicantEmployee.employee_class,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : null;
  }, [applicantEmployee]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl font-bold text-slate-900">
              {isPastLeave ? "Log Past Leave" : "New Leave Request"}
            </DialogTitle>
            {employeeClassificationLabel && (
              <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border-slate-200">
                <Briefcase className="w-3 h-3 text-slate-400" />
                {employeeClassificationLabel}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-slate-500">
            {isPastLeave
              ? "Record a past leave period that has already been taken."
              : "Submit a new time-off request with applicable notice and relief cover."}
          </DialogDescription>
        </DialogHeader>

        <form id="leave-request-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isAdmin && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">{isPastLeave ? "Log for" : "Apply For"} *</Label>
              <Select 
                value={formData.employee_email} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employee_email: value }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select employee to apply for" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id || emp._id} value={emp.email}>
                      {emp.full_name || emp.fullName} — {emp.job_title || emp.jobTitle || "Staff"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Leave Type *</Label>
                {displayLeaveTypes.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {displayLeaveTypes.length} applicable
                  </span>
                )}
              </div>
              <Select 
                value={formData.leave_type} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, leave_type: value }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {displayLeaveTypes.length > 0 ? (
                    displayLeaveTypes.map((type) => (
                      <SelectItem key={type.id || type._id} value={type.id || type._id}>
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="none">
                      No leave types available for this classification
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {formData.leave_type && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                    Policy: {applicantAllocatedDays ?? 0} days configured
                  </span>
                  {selectedBalance && typeof selectedBalance.available === "number" && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                      selectedBalance.available > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      Available: {selectedBalance.available} days remaining
                    </span>
                  )}
                </div>
              )}

              {!isPastLeave && hasNoticePeriod && noticeDays > 0 && (
                <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold">{noticeDays}-Day Notice Period Required:</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Must be booked at least {noticeDays} day(s) in advance. Earliest date available is{" "}
                      <strong className="font-semibold underline">
                        {minAllowedDate ? format(new Date(minAllowedDate + "T00:00:00"), "MMM d, yyyy") : ""}
                      </strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isHalfDay" 
                  checked={formData.isHalfDay} 
                  onChange={(e) => handleHalfDayToggle(e.target.checked)} 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="isHalfDay" className="cursor-pointer text-sm text-slate-700">
                  Half-Day Request (0.5 day)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="useMultipleDates" 
                  checked={formData.useMultipleDates} 
                  onChange={(e) => handleMultipleDatesToggle(e.target.checked)} 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="useMultipleDates" className="cursor-pointer text-sm text-slate-700">
                  Multiple Non-Continuous Dates
                </Label>
              </div>
            </div>

            {!formData.useMultipleDates ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Start Date *</Label>
                  <Input 
                    type="date" 
                    value={formData.start_date}
                    min={minAllowedDate}
                    max={isPastLeave ? format(new Date(), "yyyy-MM-dd") : undefined}
                    onChange={(e) => {
                      handleDateChange("start_date", e.target.value);
                      if (formData.isHalfDay) {
                        handleDateChange("end_date", e.target.value);
                      }
                    }}
                    className="bg-white"
                    required
                  />
                </div>

                {!formData.isHalfDay && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">End Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.end_date}
                      min={formData.start_date || minAllowedDate}
                      max={isPastLeave ? format(new Date(), "yyyy-MM-dd") : undefined}
                      onChange={(e) => handleDateChange("end_date", e.target.value)}
                      className="bg-white"
                      required
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-1 space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-slate-700">Selected Dates</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    type="date" 
                    id="multipleDateInput"
                    min={minAllowedDate}
                    max={isPastLeave ? format(new Date(), "yyyy-MM-dd") : undefined}
                      className="bg-white"
                  />
                    <Button type="button" variant="outline" onClick={() => {
                      const el = document.getElementById("multipleDateInput");
                      if (el?.value) {
                        addSelectedDate(el.value);
                        el.value = "";
                      }
                    }}>
                      Add Date
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedDates.map((date) => (
                    <Badge key={date} variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-100">
                      {format(new Date(date + "T00:00:00"), "MMM d, yyyy")}
                      <XCircle className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSelectedDate(date)} />
                    </Badge>
                  ))}
                    {formData.selectedDates.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No dates added yet</span>
                    )}
                </div>
              </div>
            )}

            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Total Working Days</Label>
              <Input type="number" value={formData.total_days} disabled className="bg-slate-50 font-semibold" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Reason *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              rows={3}
              placeholder="Provide context or reason for this leave request..."
              className="bg-white"
              required
            />
          </div>

          <LeaveHandoverFormSection
            isCompulsory={isHandoverCompulsory}
            departmentName={applicantDeptName}
            reliefOfficerId={formData.relief_officer_id}
            onReliefOfficerChange={(val) => setFormData((prev) => ({ ...prev, relief_officer_id: val }))}
            colleagues={selectableColleagues}
            handoverNote={formData.handover_note}
            onHandoverNoteChange={(val) => setFormData((prev) => ({ ...prev, handover_note: val }))}
            handoverNoteUrl={formData.handover_note_url}
            onHandoverNoteUrlChange={(url) => setFormData((prev) => ({ ...prev, handover_note_url: url }))}
          />

          {(requiresAttachment || formData.attachment_url) && (
            <div className="space-y-2 p-3.5 bg-slate-50 border rounded-lg border-slate-200">
              <Label className="text-sm font-medium text-slate-700">
                Supporting Document {requiresAttachment ? "* (Required)" : "(Optional)"}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="attachment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("attachment")?.click()}
                  disabled={uploadingFile}
                  className="bg-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile ? "Uploading..." : "Upload Document"}
                </Button>
                {formData.attachment_url && (
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <Paperclip className="w-4 h-4" />
                    Document attached
                  </div>
                )}
                {requiresAttachment && !formData.attachment_url && (
                  <span className="text-xs text-red-500">
                    Document is required for this leave type.
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            form="leave-request-form"
            type="submit"
            isLoading={isSubmitting}
            disabled={!hasRequiredRequestData || isSubmitting}
          >
            {isPastLeave
              ? (isSubmitting ? "Logging Past Leave..." : "Log Past Leave")
              : (isSubmitting ? "Submitting..." : "Submit Request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
