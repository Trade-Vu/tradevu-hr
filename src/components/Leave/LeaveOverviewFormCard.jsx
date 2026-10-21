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
import LeaveBalanceIndicator from "@/components/Leave/LeaveBalanceIndicator";
import { useLeaveOverviewForm } from "@/components/Leave/useLeaveOverviewForm";
import { formatEmploymentType } from "@/lib/formOptions";

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
    isReliefOfficerRequired,
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
      formatEmploymentType(applicantEmployee.employmentType || applicantEmployee.employment_type),
      applicantEmployee.employeeClass || applicantEmployee.employee_class,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : null;
  }, [applicantEmployee]);

    console.log({ employeeClassificationLabel, applicantEmployee });

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

        <form id="leave-request-form" onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
          {isAdmin && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                {isPastLeave ? "Log for" : "Apply For"} <span className="text-rose-600">*</span>
              </Label>
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
                <Label className="text-sm font-medium text-slate-700">
                  Leave Type <span className="text-rose-600">*</span>
                </Label>
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
                <LeaveBalanceIndicator
                  allocatedDays={applicantAllocatedDays}
                  selectedBalance={selectedBalance}
                />
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

            <div className="pt-1 space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isHalfDay" 
                  checked={formData.isHalfDay} 
                  onChange={(e) => handleHalfDayToggle(e.target.checked)} 
                  className="text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <Label htmlFor="isHalfDay" className="text-sm cursor-pointer text-slate-700">
                  Half-Day Request (0.5 day)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="useMultipleDates" 
                  checked={formData.useMultipleDates} 
                  onChange={(e) => handleMultipleDatesToggle(e.target.checked)} 
                  className="text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <Label htmlFor="useMultipleDates" className="text-sm cursor-pointer text-slate-700">
                  Multiple Non-Continuous Dates
                </Label>
              </div>
            </div>

            {!formData.useMultipleDates ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Start Date <span className="text-rose-600">*</span>
                  </Label>
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
                    <Label className="text-sm font-medium text-slate-700">
                      End Date <span className="text-rose-600">*</span>
                    </Label>
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
                      <span className="text-xs italic text-slate-400">No dates added yet</span>
                    )}
                </div>
              </div>
            )}

            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-slate-700">Total Working Days</Label>
              <Input type="number" value={formData.total_days} disabled className="font-semibold bg-slate-50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Reason <span className="text-rose-600">*</span>
            </Label>
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
            requiresReliefOfficer={isReliefOfficerRequired}
            departmentName={applicantDeptName}
            reliefOfficerId={formData.relief_officer_id}
            onReliefOfficerChange={(val) => setFormData((prev) => ({ ...prev, relief_officer_id: val }))}
            colleagues={selectableColleagues}
            handoverNote={formData.handover_note}
            onHandoverNoteChange={(val) => setFormData((prev) => ({ ...prev, handover_note: val }))}
            handoverNoteUrl={formData.handover_note_url}
            onHandoverNoteUrlChange={(url) => setFormData((prev) => ({ ...prev, handover_note_url: url }))}
          />

          <div className="p-4 space-y-3 bg-slate-50/70 border rounded-xl border-slate-200/90">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-bold text-slate-800">Supporting Document</Label>
                {requiresAttachment ? (
                  <Badge variant="outline" className="text-[10px] font-semibold text-rose-700 bg-rose-50 border-rose-200">
                    Required *
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-normal text-slate-500 bg-slate-100">
                    Optional
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {isPastLeave && requiresAttachment
                ? "Supporting documentation (medical certificate, doctor's report, or formal verification) is required when logging past leave."
                : requiresAttachment
                ? "A supporting document (medical report, certificate, or official letter) is required for this leave type."
                : "Attach any relevant supporting document or note for your leave record."}
            </p>

            <div className="pt-0.5">
              <input
                type="file"
                id="attachment"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />

              {formData.attachment_url ? (
                <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium truncate">Document attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, attachment_url: "" }))}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                    title="Remove attached document"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("attachment")?.click()}
                    disabled={uploadingFile}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs h-9"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    {uploadingFile ? "Uploading..." : "Upload Document"}
                  </Button>
                  {requiresAttachment && (
                    <span className="text-xs text-rose-600 font-medium">
                      {isPastLeave ? "Required for logging past leave" : "Required for this leave type"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        <DialogFooter className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
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
