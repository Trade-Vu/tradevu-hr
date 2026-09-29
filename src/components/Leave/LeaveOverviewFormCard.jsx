import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Paperclip, XCircle, Calendar } from "lucide-react";
import LeaveHandoverFormSection from "@/components/Leave/LeaveHandoverFormSection";
import { useLeaveOverviewForm } from "@/components/Leave/useLeaveOverviewForm";

export default function LeaveOverviewFormCard({
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
    selectedLeaveTypeObj,
    hasNoticePeriod,
    noticeDays,
    minAllowedDate,
    applicantDeptName,
    selectableColleagues,
    isHandoverCompulsory,
    isHandoverHidden,
    requiresAttachment,
    hasRequiredRequestData,
    handleDateChange,
    handleHalfDayToggle,
    handleMultipleDatesToggle,
    addSelectedDate,
    removeSelectedDate,
    handleFileUpload,
    handleSubmit,
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

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <CardTitle>{isPastLeave ? "Log Past Leave" : "New Leave Request"}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Apply For</Label>
              <Select 
                value={formData.employee_email} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, employee_email: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.email}>
                      {emp.full_name} - {emp.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select 
                value={formData.leave_type} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, leave_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isPastLeave && hasNoticePeriod && noticeDays > 0 && (
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

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isHalfDay" 
                  checked={formData.isHalfDay} 
                  onChange={(e) => handleHalfDayToggle(e.target.checked)} 
                  className="rounded border-slate-300"
                />
                <Label htmlFor="isHalfDay">Half-Day Request</Label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="useMultipleDates" 
                  checked={formData.useMultipleDates} 
                  onChange={(e) => handleMultipleDatesToggle(e.target.checked)} 
                  className="rounded border-slate-300"
                />
                <Label htmlFor="useMultipleDates">Multiple Non-Continuous Dates</Label>
              </div>
            </div>

            {!formData.useMultipleDates ? (
              <>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
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
                      max={isPastLeave ? format(new Date(), "yyyy-MM-dd") : undefined}
                      onChange={(e) => handleDateChange("end_date", e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-1 space-y-2 md:col-span-2">
                <Label>Selected Dates</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    type="date" 
                    id="multipleDateInput"
                    min={minAllowedDate}
                    max={isPastLeave ? format(new Date(), "yyyy-MM-dd") : undefined}
                  />
                  <Button type="button" onClick={() => {
                    const val = document.getElementById("multipleDateInput")?.value;
                    if (val) addSelectedDate(val);
                  }}>Add Date</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedDates.map((date) => (
                    <Badge key={date} variant="secondary" className="flex items-center gap-2 px-3 py-1 text-sm">
                      {format(new Date(date), "MMM d, yyyy")}
                      <XCircle className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSelectedDate(date)} />
                    </Badge>
                  ))}
                  {formData.selectedDates.length === 0 && <span className="text-sm text-slate-500">No dates added yet</span>}
                </div>
              </div>
            )}

            <div className="col-span-1 space-y-2 md:col-span-2">
              <Label>Total Days</Label>
              <Input type="number" value={formData.total_days} disabled className="bg-slate-50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              rows={4}
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
            <div className="space-y-2">
              <Label>Supporting Document {requiresAttachment ? "* (Required)" : "(Optional)"}</Label>
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
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFile ? "Uploading..." : "Upload Document"}
                </Button>
                {formData.attachment_url && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Paperclip className="w-4 h-4" />
                    Document attached
                  </div>
                )}
                {requiresAttachment && !formData.attachment_url && (
                  <span className="text-sm text-red-500">
                    Document is required for this request.
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isSubmitting} 
              disabled={!hasRequiredRequestData || isSubmitting}
            >
              {isPastLeave 
                ? (isSubmitting ? "Logging Past Leave..." : "Log Past Leave")
                : (isSubmitting ? "Submitting..." : "Submit Request")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
