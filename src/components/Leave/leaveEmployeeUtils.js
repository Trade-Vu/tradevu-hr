/**
 * Utilities for extracting and normalizing employee information from leave requests.
 */

export function getLeaveEmployeeName(leave, fallback = 'Employee') {
  if (!leave) return fallback;

  // 1. If explicit non-placeholder name is already present
  if (leave.employee_name && leave.employee_name !== 'Employee') {
    return leave.employee_name;
  }
  if (leave.employeeName && leave.employeeName !== 'Employee') {
    return leave.employeeName;
  }

  // 2. Extract from employeeId or employee object
  const emp = leave.employeeId || leave.employee;
  if (typeof emp === 'object' && emp !== null) {
    const directName =
      emp.fullName ||
      emp.full_name ||
      emp.name ||
      (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : null) ||
      (emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : null) ||
      emp.user?.fullName ||
      emp.user?.full_name ||
      emp.user?.name;
    if (directName) return directName;
  }

  // 3. Fallback to email prefix if present
  const email =
    (typeof emp === 'object' && emp !== null ? emp.email : null) ||
    leave.employee_email ||
    leave.employeeEmail;

  if (email && typeof email === 'string' && email.includes('@')) {
    return email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return leave.employee_name || fallback;
}

export function getLeaveEmployeeInitials(name) {
  if (!name || name === 'Employee') return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function getLeaveDepartmentName(leave, fallback = '') {
  if (!leave) return fallback;
  if (leave.department_name) return leave.department_name;

  const emp = leave.employeeId || leave.employee;
  if (typeof emp === 'object' && emp !== null) {
    return emp.departmentId?.name || emp.department?.name || emp.department || fallback;
  }

  return fallback;
}
