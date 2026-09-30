import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { leaveApi } from "@/api";
import { extractErrorMessage } from "@/lib/utils";
import { calculateWorkingDays } from "@/lib/leaveDays";
import { uploadToCloudinary } from "@/utils/cloudinary";
import {
  findApplicantEmployee,
  filterApplicableLeaveTypes,
  buildLeaveRequestPayload,
} from "./leaveEligibilityUtils";

export function useLeaveOverviewForm({
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    employee_email: user?.email || "",
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    total_days: 0,
    attachment_url: "",
    handover_note: "",
    handover_note_url: "",
    relief_officer_id: "",
    isHalfDay: false,
    useMultipleDates: false,
    selectedDates: [],
  });

  useEffect(() => {
    if (user && !formData.employee_email) {
      setFormData((prev) => ({ ...prev, employee_email: user.email }));
    }
  }, [user]);

  // Determine current applicant employee object
  const applicantEmployee = useMemo(() => {
    const targetEmail = isAdmin && formData.employee_email ? formData.employee_email : user?.email;
    return findApplicantEmployee(employees, targetEmail, user);
  }, [isAdmin, formData.employee_email, user, employees]);

  // Dynamically filter leave types applicable to applicant's employee class & type
  const availableLeaveTypes = useMemo(() => {
    return filterApplicableLeaveTypes(leaveTypes, applicantEmployee);
  }, [leaveTypes, applicantEmployee]);

  // Select first available leave type if current is empty or not in available list
  useEffect(() => {
    if (availableLeaveTypes.length > 0) {
      const isValidCurrent = availableLeaveTypes.some((t) => (t.id || t._id) === formData.leave_type);
      if (!formData.leave_type || !isValidCurrent) {
        setFormData((prev) => ({ ...prev, leave_type: availableLeaveTypes[0].id || availableLeaveTypes[0]._id }));
      }
    }
  }, [availableLeaveTypes]);

  const selectedLeaveTypeObj = useMemo(() => {
    return leaveTypes.find((t) => (t.id || t._id) === formData.leave_type);
  }, [leaveTypes, formData.leave_type]);

  const hasNoticePeriod = !isPastLeave && Boolean(
    selectedLeaveTypeObj?.hasNoticePeriod ||
    (selectedLeaveTypeObj?.noticePeriodDays > 0) ||
    (selectedLeaveTypeObj?.noticeDaysRequired > 0)
  );

  const noticeDays = hasNoticePeriod
    ? (selectedLeaveTypeObj.noticePeriodDays || selectedLeaveTypeObj.noticeDaysRequired || 0)
    : 0;

  const minAllowedDate = useMemo(() => {
    if (isPastLeave) return undefined;
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + noticeDays);
    return format(target, "yyyy-MM-dd");
  }, [isPastLeave, noticeDays]);

  const calculateDays = (start, end) => calculateWorkingDays(start, end, publicHolidays);

  // If selected dates are before minAllowedDate, adjust them
  useEffect(() => {
    if (!isPastLeave && minAllowedDate) {
      if (formData.start_date && formData.start_date < minAllowedDate) {
        setFormData((prev) => {
          const newStart = minAllowedDate;
          const newEnd = prev.end_date && prev.end_date < minAllowedDate ? minAllowedDate : prev.end_date;
          const days = calculateDays(newStart, newEnd);
          return {
            ...prev,
            start_date: newStart,
            end_date: newEnd,
            total_days: prev.isHalfDay ? days * 0.5 : days,
          };
        });
      }
      if (formData.selectedDates?.length > 0 && formData.selectedDates.some((d) => d < minAllowedDate)) {
        const filtered = formData.selectedDates.filter((d) => d >= minAllowedDate);
        const workingDays = filtered.reduce(
          (total, d) => total + calculateWorkingDays(d, d, publicHolidays),
          0
        );
        setFormData((prev) => ({
          ...prev,
          selectedDates: filtered,
          total_days: prev.isHalfDay ? workingDays * 0.5 : workingDays,
        }));
      }
    }
  }, [minAllowedDate, isPastLeave]);

  const handleDateChange = (field, value) => {
    if (field === "start_date" && minAllowedDate && value < minAllowedDate) {
      toast.error(`Start date cannot be earlier than ${minAllowedDate} (${noticeDays} day(s) notice required).`);
      return;
    }
    if (field === "end_date" && minAllowedDate && value < minAllowedDate) {
      toast.error(`End date cannot be earlier than ${minAllowedDate} (${noticeDays} day(s) notice required).`);
      return;
    }
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "start_date" || field === "end_date") {
        const days = calculateDays(newData.start_date, newData.end_date);
        newData.total_days = newData.isHalfDay ? days * 0.5 : days;
      }
      return newData;
    });
  };

  const handleHalfDayToggle = (isHalf) => {
    let tDays = 0;
    let newEndDate = formData.end_date;
    if (isHalf && !formData.useMultipleDates) {
      newEndDate = formData.start_date;
    }
    if (formData.useMultipleDates) {
      tDays = formData.selectedDates.length * (isHalf ? 0.5 : 1);
    } else {
      tDays = calculateDays(formData.start_date, newEndDate) * (isHalf ? 0.5 : 1);
    }
    setFormData((prev) => ({ ...prev, isHalfDay: isHalf, end_date: newEndDate, total_days: tDays }));
  };

  const handleMultipleDatesToggle = (useMultiple) => {
    let tDays = 0;
    if (useMultiple) {
      tDays = formData.selectedDates.length * (formData.isHalfDay ? 0.5 : 1);
    } else {
      tDays = calculateDays(formData.start_date, formData.end_date) * (formData.isHalfDay ? 0.5 : 1);
    }
    setFormData((prev) => ({ ...prev, useMultipleDates: useMultiple, total_days: tDays }));
  };

  const addSelectedDate = (date) => {
    if (!date) return;
    if (!isPastLeave && minAllowedDate && date < minAllowedDate) {
      toast.error(`Date ${date} cannot be selected. This leave requires at least ${noticeDays} day(s) notice.`);
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

  const createLeaveMutation = useMutation({
    mutationFn: (data) => leaveApi.createRequest(buildLeaveRequestPayload(data, false, isAdmin, employees)),
    onSuccess: () => {
      toast.success("Leave request submitted successfully.");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error(extractErrorMessage(error, "Failed to submit leave request."));
    },
  });

  const logPastLeaveMutation = useMutation({
    mutationFn: (data) => leaveApi.createRequest(buildLeaveRequestPayload(data, true, isAdmin, employees)),
    onSuccess: () => {
      toast.success("Past leave successfully logged.");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error(error);
      toast.error(extractErrorMessage(error, "Failed to log past leave."));
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult || !uploadResult.secure_url) {
        throw new Error("Failed to upload document to cloud storage.");
      }
      setFormData((prev) => ({ ...prev, attachment_url: uploadResult.secure_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
      setFormData((prev) => ({ ...prev, attachment_url: "" }));
    }
    setUploadingFile(false);
  };

  const applicantDeptId = applicantEmployee?.departmentId?._id || applicantEmployee?.departmentId?.id || applicantEmployee?.departmentId;
  const applicantDeptName = applicantEmployee?.departmentId?.name || applicantEmployee?.department?.name || "";

  const departmentColleagues = employees.filter((e) => {
    const empId = e.id || e._id;
    const appId = applicantEmployee?.id || applicantEmployee?._id;
    if (empId === appId || (e.email || "").toLowerCase() === (applicantEmployee?.email || "").toLowerCase()) return false;
    const empDeptId = e.departmentId?._id || e.departmentId?.id || e.departmentId;
    if (!applicantDeptId || !empDeptId) return false;
    return empDeptId.toString() === applicantDeptId.toString();
  });

  const selectableColleagues = departmentColleagues.length > 0
    ? departmentColleagues
    : employees.filter((e) => {
        const empId = e.id || e._id;
        const appId = applicantEmployee?.id || applicantEmployee?._id;
        return empId !== appId && (e.email || "").toLowerCase() !== (applicantEmployee?.email || "").toLowerCase();
      });

  const isHandoverCompulsory = Boolean(
    (selectedLeaveTypeObj?.requiresHandover ||
    selectedLeaveTypeObj?.handoverRequirement === "COMPULSORY") &&
    selectedLeaveTypeObj?.handoverRequirement !== "NONE"
  );
  const isHandoverHidden = selectedLeaveTypeObj?.handoverRequirement === "NONE";

  const requiresAttachment = selectedLeaveTypeObj && (
    selectedLeaveTypeObj.requiresAttachment ||
    selectedLeaveTypeObj.name === "Study Leave" || 
    (selectedLeaveTypeObj.name === "Sick Leave" && formData.total_days > 2)
  );

  const hasRequiredRequestData = Boolean(
    formData.leave_type &&
    formData.reason.trim() &&
    formData.total_days > 0 &&
    (formData.useMultipleDates
      ? formData.selectedDates.length > 0
      : formData.start_date && formData.end_date) &&
    (!isAdmin || formData.employee_email) &&
    (!requiresAttachment || formData.attachment_url)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasRequiredRequestData) {
      toast.error("Complete all required leave request fields before submitting.");
      return;
    }

    if (!isPastLeave && noticeDays > 0 && minAllowedDate) {
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

    if (requiresAttachment && !formData.attachment_url) {
      toast.error("Please upload a supporting document for your leave request.");
      return;
    }

    if (isHandoverCompulsory) {
      if (!formData.relief_officer_id) {
        toast.error("Please select a Relief Officer from your department to confirm your handover note.");
        return;
      }
      if (!formData.handover_note?.trim() && !formData.handover_note_url) {
        toast.error("Handover note is required for this leave type. Please provide a summary or upload a completed note.");
        return;
      }
    }

    const selectedBalance = leaveBalances.find((b) => b.leaveTypeId === formData.leave_type);
    if (selectedBalance && formData.total_days > selectedBalance.available) {
      toast.error(`You cannot request ${formData.total_days} days. You only have ${selectedBalance.available} available for this leave type.`);
      return;
    }

    if (isPastLeave) {
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const startD = new Date(formData.useMultipleDates && formData.selectedDates.length > 0 ? formData.selectedDates[0] : formData.start_date);
      const endD = new Date(formData.useMultipleDates && formData.selectedDates.length > 0 ? formData.selectedDates[formData.selectedDates.length - 1] : formData.end_date);
      if (startD > todayEnd || endD > todayEnd) {
        toast.error("Past leave dates cannot be in the future.");
        return;
      }
      logPastLeaveMutation.mutate(formData);
    } else {
      createLeaveMutation.mutate(formData);
    }
  };

  const isSubmitting = isPastLeave ? logPastLeaveMutation.isPending : createLeaveMutation.isPending;

  return {
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
    availableLeaveTypes,
    applicantEmployee,
  };
}
