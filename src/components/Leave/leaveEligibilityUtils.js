import { calculateWorkingDays } from "@/lib/leaveDays";

/**
 * Normalizes a classification string (e.g. 'Mid Level Manager' -> 'MID_LEVEL_MANAGER')
 * to allow resilient case- and format-insensitive comparisons.
 */
export function normalizeClassification(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim().toUpperCase().replace(/[\s_-]+/g, "_");
}

/**
 * Finds the target applicant employee object from the employee directory or current user.
 */
export function findApplicantEmployee(employees = [], targetEmail = "", user = null) {
  const normalizedTarget = (targetEmail || user?.email || "").toLowerCase().trim();

  if (Array.isArray(employees) && employees.length > 0) {
    const found = employees.find(
      (e) => (e.email || "").toLowerCase().trim() === normalizedTarget
    );
    if (found) return found;
  }

  if (user?.employeeId && typeof user.employeeId === "object") {
    return user.employeeId;
  }

  if (user?.employee && typeof user.employee === "object") {
    return user.employee;
  }

  return null;
}

/**
 * Checks whether a leave type is applicable to an employee based on their
 * employmentType and employeeClass restrictions configured on the leave type.
 */
export function isLeaveTypeApplicable(leaveType, employee) {
  if (!leaveType) return false;

  const empType = normalizeClassification(
    employee?.employmentType || employee?.employment_type || ""
  );
  const empClass = normalizeClassification(
    employee?.employeeClass || employee?.employee_class || ""
  );

  const allowedTypes = Array.isArray(leaveType.employmentTypes)
    ? leaveType.employmentTypes.map(normalizeClassification).filter(Boolean)
    : [];

  const allowedClasses = Array.isArray(leaveType.employeeClasses)
    ? leaveType.employeeClasses.map(normalizeClassification).filter(Boolean)
    : [];

  // If the leave type is restricted to confirmed employees only (exclude probation):
  if (leaveType.onlyConfirmed) {
    const status = String(
      employee?.employmentStatus || employee?.employment_status || ""
    ).trim().toUpperCase();
    if (status === "PROBATION") {
      return false;
    }
  }

  // If the leave type restricts employment types:
  if (allowedTypes.length > 0) {
    if (!empType || !allowedTypes.includes(empType)) {
      return false;
    }
  }

  // If the leave type restricts employee categories/classes:
  if (allowedClasses.length > 0) {
    if (!empClass || !allowedClasses.includes(empClass)) {
      return false;
    }
  }

  return true;
}

/**
 * Filters a list of leave types to only those applicable to the applicant employee.
 * If employee has no classification data yet and filtering produces an empty list,
 * falls back to unrestricted leave types or all leave types to prevent a broken form.
 */
export function filterApplicableLeaveTypes(leaveTypes = [], employee = null) {
  if (!Array.isArray(leaveTypes) || leaveTypes.length === 0) return [];

  const applicable = leaveTypes.filter((lt) => isLeaveTypeApplicable(lt, employee));
  if (applicable.length > 0) return applicable;

  // If no direct matches (e.g. employee profile unclassified), return unrestricted leave types
  const unrestricted = leaveTypes.filter((lt) => {
    const noTypeLimits = !Array.isArray(lt.employmentTypes) || lt.employmentTypes.length === 0;
    const noClassLimits = !Array.isArray(lt.employeeClasses) || lt.employeeClasses.length === 0;
    const notOnlyConfirmed = !lt.onlyConfirmed;
    return noTypeLimits && noClassLimits && notOnlyConfirmed;
  });

  return unrestricted.length > 0 ? unrestricted : leaveTypes;
}

/**
 * Builds the request payload for creating a leave request or logging past leave.
 */
export function buildLeaveRequestPayload(data, isPast, isAdmin, employees = []) {
  const start = data.useMultipleDates && data.selectedDates?.length > 0
    ? data.selectedDates[0]
    : data.start_date;

  const end = data.useMultipleDates && data.selectedDates?.length > 0
    ? data.selectedDates[data.selectedDates.length - 1]
    : data.end_date;

  const targetEmp = isAdmin && data.employee_email
    ? employees.find((e) => (e.email || "").toLowerCase() === data.employee_email.toLowerCase())
    : null;

  return {
    employeeId: targetEmp?._id || targetEmp?.id || undefined,
    leaveTypeId: data.leave_type,
    startDate: new Date(start).toISOString(),
    endDate: new Date(end).toISOString(),
    reason: data.reason,
    attachmentUrl: data.attachment_url,
    handoverNote: data.handover_note,
    handoverNoteUrl: data.handover_note_url,
    reliefOfficerId: data.relief_officer_id || undefined,
    isHalfDay: !!data.isHalfDay,
    isPastLeave: Boolean(isPast),
    selectedDates: data.useMultipleDates && data.selectedDates?.length > 0 ? data.selectedDates : undefined,
  };
}
