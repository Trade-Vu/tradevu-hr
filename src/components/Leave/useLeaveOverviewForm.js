import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { leaveApi } from "@/api";
import { extractErrorMessage } from "@/lib/utils";
import { calculateWorkingDays } from "@/lib/leaveDays";
import { uploadToCloudinary } from "@/utils/cloudinary";
import {
  findApplicantEmployee,
  filterApplicableLeaveTypes,
  buildLeaveRequestPayload,
  getEmployeeAllocatedLeaveDays,
  normalizeBalanceList,
  resolveDepartmentAndColleagues,
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

  const applicantEmployeeId = applicantEmployee?._id || applicantEmployee?.id;

  // Query applicant employee's balances so admins see and validate against target employee data
  const { data: targetApplicantBalances = [], isLoading: isLoadingApplicantBalances } = useQuery({
    queryKey: ['leave-balances', applicantEmployeeId],
    queryFn: async () => {
      if (!applicantEmployeeId) return [];
      const res = await leaveApi.getBalances(applicantEmployeeId);
      return normalizeBalanceList(res);
    },
    enabled: Boolean(applicantEmployeeId),
  });

  const effectiveBalances = useMemo(() => {
    if (targetApplicantBalances?.length > 0) return targetApplicantBalances;
    if (!isAdmin && Array.isArray(leaveBalances) && leaveBalances.length > 0) return leaveBalances;
    return targetApplicantBalances || [];
  }, [targetApplicantBalances, leaveBalances, isAdmin]);

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

  const selectedBalance = useMemo(() => {
    if (!formData.leave_type || !effectiveBalances.length) return null;
    return effectiveBalances.find((b) => String(b.leaveTypeId) === String(formData.leave_type)) || null;
  }, [effectiveBalances, formData.leave_type]);

  const applicantAllocatedDays = useMemo(() => {
    if (!selectedLeaveTypeObj) return 0;
    return getEmployeeAllocatedLeaveDays(selectedLeaveTypeObj, applicantEmployee);
  }, [selectedLeaveTypeObj, applicantEmployee]);

  const noticeDays = !isPastLeave && (selectedLeaveTypeObj?.hasNoticePeriod || (selectedLeaveTypeObj?.noticePeriodDays > 0) || (selectedLeaveTypeObj?.noticeDaysRequired > 0))
    ? (selectedLeaveTypeObj.noticePeriodDays || selectedLeaveTypeObj.noticeDaysRequired || 0)
    : 0;
  const hasNoticePeriod = noticeDays > 0;

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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      start_date: "",
      end_date: "",
      selectedDates: [],
      total_days: 0,
    }));
  }, [isPastLeave]);

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
    const newEnd = isHalf && !formData.useMultipleDates ? formData.start_date : formData.end_date;
    const baseDays = formData.useMultipleDates
      ? formData.selectedDates.length
      : calculateDays(formData.start_date, newEnd);
    setFormData((prev) => ({ ...prev, isHalfDay: isHalf, end_date: newEnd, total_days: isHalf ? baseDays * 0.5 : baseDays }));
  };

  const handleMultipleDatesToggle = (useMultiple) => {
    const baseDays = useMultiple
      ? formData.selectedDates.length
      : calculateDays(formData.start_date, formData.end_date);
    setFormData((prev) => ({ ...prev, useMultipleDates: useMultiple, total_days: prev.isHalfDay ? baseDays * 0.5 : baseDays }));
  };

  const updateSelectedDates = (newDates) => {
    const workingDays = newDates.reduce(
      (total, d) => total + calculateWorkingDays(d, d, publicHolidays),
      0
    );
    setFormData((prev) => ({
      ...prev,
      selectedDates: newDates,
      total_days: prev.isHalfDay ? workingDays * 0.5 : workingDays,
    }));
  };

  const addSelectedDate = (date) => {
    if (!date) return;
    if (!isPastLeave && minAllowedDate && date < minAllowedDate) {
      toast.error(`Date ${date} cannot be selected. This leave requires at least ${noticeDays} day(s) notice.`);
      return;
    }
    updateSelectedDates([...formData.selectedDates, date].sort());
  };

  const removeSelectedDate = (date) => {
    updateSelectedDates(formData.selectedDates.filter((d) => d !== date));
  };

  const handleMutationSuccess = (message) => {
    toast.success(message);
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const createLeaveMutation = useMutation({
    mutationFn: (data) => leaveApi.createRequest(buildLeaveRequestPayload(data, false, isAdmin, employees)),
    onSuccess: () => handleMutationSuccess("Leave request submitted successfully."),
    onError: (error) => {
      console.error(error);
      toast.error(extractErrorMessage(error, "Failed to submit leave request."));
    },
  });

  const logPastLeaveMutation = useMutation({
    mutationFn: (data) => leaveApi.createRequest(buildLeaveRequestPayload(data, true, isAdmin, employees)),
    onSuccess: () => handleMutationSuccess("Past leave successfully logged."),
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

  const { departmentName: applicantDeptName, colleagues: selectableColleagues } = useMemo(
    () => resolveDepartmentAndColleagues(employees, applicantEmployee),
    [employees, applicantEmployee]
  );

  const isReliefOfficerRequired = selectedLeaveTypeObj?.requiresReliefOfficer !== false;
  const isHandoverCompulsory = Boolean(
    selectedLeaveTypeObj?.requiresHandover ||
    selectedLeaveTypeObj?.handoverRequirement === "COMPULSORY"
  );

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
    (!requiresAttachment || formData.attachment_url) &&
    (!isReliefOfficerRequired || isPastLeave || formData.relief_officer_id) &&
    (!isHandoverCompulsory || (formData.handover_note?.trim() || formData.handover_note_url))
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

    if (!isPastLeave && isReliefOfficerRequired && !formData.relief_officer_id) {
      toast.error("Please select a Relief Officer from your department to cover during your leave.");
      return;
    }

    if (isHandoverCompulsory && !formData.handover_note?.trim() && !formData.handover_note_url) {
      toast.error("Handover note is required for this leave type. Please upload a completed note.");
      return;
    }

    // Enforce that Super Admin / Admin cannot override configured or available days
    if (selectedBalance && typeof selectedBalance.available === 'number') {
      if (formData.total_days > selectedBalance.available) {
        toast.error(`You cannot request ${formData.total_days} days. This employee only has ${selectedBalance.available} day(s) available for this leave type.`);
        return;
      }
    } else if (applicantAllocatedDays !== undefined && applicantAllocatedDays > 0) {
      if (formData.total_days > applicantAllocatedDays) {
        toast.error(`You cannot request ${formData.total_days} days. Policy allows a maximum of ${applicantAllocatedDays} day(s) for this leave type.`);
        return;
      }
    }

    if (applicantAllocatedDays === 0) {
      toast.error(`This employee is not eligible for ${selectedLeaveTypeObj?.name || 'this leave type'} (0 days allocated).`);
      return;
    }

    if (isPastLeave) {
      const todayEnd = new Date().setHours(23, 59, 59, 999);
      const dates = formData.useMultipleDates && formData.selectedDates?.length > 0
        ? formData.selectedDates
        : [formData.start_date, formData.end_date];
      if (dates.some((d) => d && new Date(d).getTime() > todayEnd)) {
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
    isLoadingApplicantBalances,
  };
}
