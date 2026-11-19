/**
 * companyLibraryUtils.js
 * Frontend helpers for client-side evaluation of folder access rules.
 * Mirrors the backend logic in tradevu-hr-backend CompanyLibraryService.
 */

function normalizeString(val) {
  return String(val || '').trim().toUpperCase();
}

function normalizeArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) {
    return arr.map(normalizeString).filter(Boolean);
  }
  return [normalizeString(arr)].filter(Boolean);
}

export function checkEmployeeFolderAccess(folder, employee, user) {
  if (!folder) return false;
  if (folder.isPublic) return true;

  // 1. Specific user targeting check (OR logic with attributes)
  const allowedUserIds = (folder.allowedUserIds || [])
    .map((id) => String(id).trim())
    .filter(Boolean);

  if (allowedUserIds.length > 0) {
    const idsToCheck = [
      user?._id?.toString(),
      user?.id?.toString(),
      employee?.userId?._id?.toString(),
      employee?.userId?.toString(),
      employee?._id?.toString(),
      employee?.id?.toString(),
    ].filter(Boolean);

    if (idsToCheck.some((id) => allowedUserIds.includes(id))) {
      return true;
    }
  }

  const allowedClasses = normalizeArray(folder.allowedClasses);
  const allowedEmploymentTypes = normalizeArray(folder.allowedEmploymentTypes);
  const allowedDepartmentIds = normalizeArray(folder.allowedDepartmentIds);

  // If no restrictions configured, treat as public
  if (
    allowedUserIds.length === 0 &&
    allowedClasses.length === 0 &&
    allowedEmploymentTypes.length === 0 &&
    allowedDepartmentIds.length === 0
  ) {
    return true;
  }

  // If only specific users were allowed and not matched above, reject
  if (
    allowedClasses.length === 0 &&
    allowedEmploymentTypes.length === 0 &&
    allowedDepartmentIds.length === 0
  ) {
    return false;
  }

  if (!employee) return false;

  if (allowedClasses.length > 0) {
    const empClass = normalizeString(employee.employeeClass);
    if (!empClass || !allowedClasses.includes(empClass)) {
      return false;
    }
  }

  if (allowedEmploymentTypes.length > 0) {
    const empType = normalizeString(employee.employmentType);
    if (!empType || !allowedEmploymentTypes.includes(empType)) {
      return false;
    }
  }

  if (allowedDepartmentIds.length > 0) {
    const empDept = normalizeString(employee.departmentId?._id || employee.departmentId);
    if (!empDept || !allowedDepartmentIds.includes(empDept)) {
      return false;
    }
  }

  return true;
}
