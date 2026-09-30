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
 * Resolves the specific allocated leave days for an employee taking into account
 * any INDIVIDUAL, CLASS, or TYPE exceptions configured on the leave type.
 */
export function getEmployeeAllocatedLeaveDays(leaveType, employee) {
  if (!leaveType) return 0;
  const baseDays = leaveType.defaultDays ?? leaveType.daysPerYear ?? 0;
  if (!employee || !Array.isArray(leaveType.daysExceptions) || leaveType.daysExceptions.length === 0) {
    return baseDays;
  }

  const empId = String(employee.id || employee._id || '').trim();
  const empClass = normalizeClassification(employee.employeeClass || employee.employee_class || '');
  const empType = normalizeClassification(employee.employmentType || employee.employment_type || '');

  // 1. INDIVIDUAL match (highest priority)
  const indEx = leaveType.daysExceptions.find(
    (ex) =>
      (ex.category === 'INDIVIDUAL' || String(ex.subjectId).trim() === empId) &&
      String(ex.subjectId).trim() === empId
  );
  if (indEx !== undefined) return indEx.days;

  // 2. Both Employment Type and Employee Class match (most specific)
  const exactComboEx = leaveType.daysExceptions.find((ex) => {
    const typeVal = normalizeClassification(ex.employmentType || (ex.category !== 'CLASS' && ex.category !== 'INDIVIDUAL' ? ex.category : ''));
    const classVal = normalizeClassification(ex.employeeClass || (ex.category === 'CLASS' ? ex.subjectId : '') || ex.subjectId || '');
    const typeMatches = typeVal && typeVal !== 'ALL' && typeVal === empType;
    const classMatches = classVal && classVal !== 'ALL' && classVal === empClass;
    return typeMatches && classMatches;
  });
  if (exactComboEx !== undefined) return exactComboEx.days;

  // 3. Employee Class match
  const classEx = leaveType.daysExceptions.find((ex) => {
    const typeVal = normalizeClassification(ex.employmentType || (ex.category !== 'CLASS' && ex.category !== 'INDIVIDUAL' ? ex.category : ''));
    const classVal = normalizeClassification(ex.employeeClass || (ex.category === 'CLASS' ? ex.subjectId : '') || ex.subjectId || '');
    const typeMatches = !typeVal || typeVal === 'ALL' || typeVal === empType;
    return typeMatches && classVal && classVal !== 'ALL' && classVal === empClass;
  });
  if (classEx !== undefined) return classEx.days;

  // 4. Employment Type match
  const typeEx = leaveType.daysExceptions.find((ex) => {
    const typeVal = normalizeClassification(ex.employmentType || (ex.category !== 'CLASS' && ex.category !== 'INDIVIDUAL' ? ex.category : ''));
    const classVal = normalizeClassification(ex.employeeClass || (ex.category === 'CLASS' ? ex.subjectId : '') || ex.subjectId || '');
    const classMatches = !classVal || classVal === 'ALL';
    return typeVal && typeVal !== 'ALL' && typeVal === empType && classMatches;
  });
  if (typeEx !== undefined) return typeEx.days;

  return baseDays;
}

/**
 * Checks whether a leave type is applicable to an employee based on their
 * quota exceptions (0 days = ineligible) and legacy exclusion rules.
 */
export function isLeaveTypeApplicable(leaveType, employee) {
  if (!leaveType) return false;

  // If the employee is specifically allocated 0 days via exceptions, they are ineligible.
  if (Array.isArray(leaveType.daysExceptions) && leaveType.daysExceptions.length > 0) {
    const allocated = getEmployeeAllocatedLeaveDays(leaveType, employee);
    if (allocated === 0) {
      return false;
    }
  }

  const empType = normalizeClassification(
    employee?.employmentType || employee?.employment_type || ""
  );
  const empClass = normalizeClassification(
    employee?.employeeClass || employee?.employee_class || ""
  );

  const excludedTypes = Array.isArray(leaveType.employmentTypes)
    ? leaveType.employmentTypes.map(normalizeClassification).filter(Boolean)
    : [];

  const excludedClasses = Array.isArray(leaveType.employeeClasses)
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

  // Exception logic for employment types:
  // If an employee's employment type matches any of the configured exceptions, they are ineligible.
  if (excludedTypes.length > 0 && empType) {
    if (excludedTypes.includes(empType)) {
      return false;
    }
  }

  // Exception logic for employee categories/classes:
  // If an employee's category/class matches any of the configured exceptions, they are ineligible.
  if (excludedClasses.length > 0 && empClass) {
    if (excludedClasses.includes(empClass)) {
      return false;
    }
  }

  return true;
}

/**
 * Filters a list of leave types to only those applicable to the applicant employee.
 * If filtering produces an empty list, falls back to all leave types to prevent a broken form.
 */
export function filterApplicableLeaveTypes(leaveTypes = [], employee = null) {
  if (!Array.isArray(leaveTypes) || leaveTypes.length === 0) return [];

  const applicable = leaveTypes.filter((lt) => isLeaveTypeApplicable(lt, employee));
  if (applicable.length > 0) return applicable;

  return leaveTypes;
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
