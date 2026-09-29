import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/utils/cloudinary";
import { calculateWorkingDays } from "@/lib/leaveDays";

export function useLeaveRequestDialogForm({
  open = false,
  editingLeave = null,
  leaveTypes = [],
  publicHolidays = [],
}) {
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    attachment_url: "",
    handover_note: "",
    handover_note_url: "",
    relief_officer_id: "",
    isHalfDay: false,
    useMultipleDates: false,
    selectedDates: [],
    total_days: 0,
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        employee_id: "",
        leave_type: leaveTypes[0]?.id || "",
        start_date: "",
        end_date: "",
        total_days: 0,
        reason: "",
        attachment_url: "",
        handover_note: "",
        handover_note_url: "",
        relief_officer_id: "",
        isHalfDay: false,
        useMultipleDates: false,
        selectedDates: [],
      });
      return;
    }

    if (editingLeave) {
      setFormData({
        employee_id: editingLeave.employee_id || editingLeave.employeeId?._id || editingLeave.employeeId || "",
        leave_type: editingLeave.leave_type || editingLeave.leaveTypeId?._id || editingLeave.leaveTypeId || (leaveTypes[0]?.id || ""),
        start_date: editingLeave.start_date ? new Date(editingLeave.start_date).toISOString().split("T")[0] : "",
        end_date: editingLeave.end_date ? new Date(editingLeave.end_date).toISOString().split("T")[0] : "",
        total_days: editingLeave.total_days || 0,
        reason: editingLeave.reason || "",
        attachment_url: editingLeave.attachment_url || "",
        handover_note: editingLeave.handoverNote || editingLeave.handover_note || "",
        handover_note_url: editingLeave.handoverNoteUrl || editingLeave.handover_note_url || "",
        relief_officer_id: editingLeave.reliefOfficerId?._id || editingLeave.reliefOfficerId?.id || editingLeave.reliefOfficerId || editingLeave.relief_officer_id || "",
        isHalfDay: Boolean(editingLeave.isHalfDay),
        useMultipleDates: Boolean(editingLeave.selectedDates && editingLeave.selectedDates.length > 0),
        selectedDates: editingLeave.selectedDates || [],
      });
    } else {
      setFormData({
        employee_id: "",
        leave_type: leaveTypes[0]?.id || "",
        start_date: "",
        end_date: "",
        total_days: 0,
        reason: "",
        attachment_url: "",
        handover_note: "",
        handover_note_url: "",
        relief_officer_id: "",
        isHalfDay: false,
        useMultipleDates: false,
        selectedDates: [],
      });
    }
  }, [open, editingLeave, leaveTypes]);

  const selectedType = leaveTypes.find((t) => t.id === formData.leave_type);
  const hasNoticePeriod = !editingLeave && Boolean(
    selectedType?.hasNoticePeriod ||
    (selectedType?.noticePeriodDays > 0) ||
    (selectedType?.noticeDaysRequired > 0)
  );
  const noticeDays = hasNoticePeriod
    ? (selectedType.noticePeriodDays || selectedType.noticeDaysRequired || 0)
    : 0;

  const minAllowedDate = useMemo(() => {
    if (editingLeave) return undefined;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + noticeDays);
    return format(target, "yyyy-MM-dd");
  }, [editingLeave, noticeDays]);

  // Adjust dates if minAllowedDate changes and falls in the future
  useEffect(() => {
    if (!editingLeave && minAllowedDate) {
      if (formData.start_date && formData.start_date < minAllowedDate) {
        setFormData((prev) => ({
          ...prev,
          start_date: minAllowedDate,
          end_date: prev.end_date && prev.end_date < minAllowedDate ? minAllowedDate : prev.end_date,
        }));
      }
      if (formData.selectedDates?.length > 0 && formData.selectedDates.some((d) => d < minAllowedDate)) {
        const filtered = formData.selectedDates.filter((d) => d >= minAllowedDate);
        setFormData((prev) => ({ ...prev, selectedDates: filtered }));
      }
    }
  }, [minAllowedDate, editingLeave]);

  // Recalculate working days
  useEffect(() => {
    if (formData.useMultipleDates) return;
    if (formData.start_date && formData.end_date) {
      const days = calculateWorkingDays(formData.start_date, formData.end_date, publicHolidays);
      setFormData((prev) => ({
        ...prev,
        total_days: prev.isHalfDay ? (days > 0 ? days * 0.5 : 0) : days > 0 ? days : 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, total_days: 0 }));
    }
  }, [formData.start_date, formData.end_date, formData.isHalfDay, formData.useMultipleDates, publicHolidays]);

  const addSelectedDate = (date) => {
    if (!date) return;
    if (!editingLeave && minAllowedDate && date < minAllowedDate) {
      toast.error(`Date ${date} is within the ${noticeDays}-day notice period.`);
      return;
    }
    const newDates = [...formData.selectedDates, date].sort();
    const workingDays = newDates.reduce(
      (total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays),
      0
    );
    setFormData({
      ...formData,
      selectedDates: newDates,
      total_days: formData.isHalfDay ? workingDays * 0.5 : workingDays,
    });
  };

  const removeSelectedDate = (date) => {
    const newDates = formData.selectedDates.filter((d) => d !== date);
    const workingDays = newDates.reduce(
      (total, selectedDate) => total + calculateWorkingDays(selectedDate, selectedDate, publicHolidays),
      0
    );
    setFormData({
      ...formData,
      selectedDates: newDates,
      total_days: formData.isHalfDay ? workingDays * 0.5 : workingDays,
    });
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload document to cloud storage.");
      }
      setFormData((prev) => ({ ...prev, attachment_url: uploadResult.secure_url }));
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload document.");
    }
    setUploadingDoc(false);
  };

  return {
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
  };
}
