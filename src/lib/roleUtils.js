/**
 * Centralized Role Helpers for Tradevu HR
 * Handles case-insensitivity and dual-role checks consistently.
 */

export const getNormalizedRole = (user) => {
  return (user?.role || '').toUpperCase();
};

export const isSuperAdmin = (user) => {
  const role = getNormalizedRole(user);
  return role === 'SUPER_ADMIN' || Boolean(user?.isOrgOwner || user?.is_organization_owner);
};

export const isHrAdmin = (user) => {
  const role = getNormalizedRole(user);
  return role.includes('HR_ADMIN') || role === 'HR_ADMIN';
};

export const isFinanceAdmin = (user) => {
  const role = getNormalizedRole(user);
  return role.includes('FINANCE_ADMIN') || role === 'FINANCE_ADMIN';
};

export const isManager = (user) => {
  const role = getNormalizedRole(user);
  return role === 'MANAGER' || role.includes('MANAGER');
};

export const isEmployee = (user) => {
  const role = getNormalizedRole(user);
  return role === 'EMPLOYEE';
};

export const isAdmin = (user) => {
  const role = getNormalizedRole(user);
  return (
    isSuperAdmin(user) ||
    isHrAdmin(user) ||
    isFinanceAdmin(user) ||
    role === 'ADMIN' ||
    role.includes('ADMIN') ||
    Boolean(user?.isOrgOwner || user?.is_organization_owner)
  );
};

export const hasAdminPrivileges = (user) => {
  return isAdmin(user) || isManager(user);
};

/**
 * Returns true only if the user has administrative privileges IN THEIR CURRENT VIEW MODE.
 * If an HR_ADMIN has switched to 'EMPLOYEE' view mode, they are strictly limited to regular employee access.
 * SUPER_ADMIN is always in admin view.
 */
export const isInAdminMode = (user, viewMode) => {
  if (isSuperAdmin(user)) return true;
  if (viewMode === 'EMPLOYEE') return false;
  return isAdmin(user);
};

/**
 * Checks whether an employee record qualifies to be a "Reports To (Manager)".
 * Requirements:
 * 1. Must have an active user account (userActive is true).
 * 2. Must not be in DRAFT, PENDING_APPROVAL, PENDING_ONBOARDING, ONGOING_ONBOARDING,
 *    SUSPENDED, or separated employment statuses.
 * 3. Must have "Manager" in their role or job title, OR be the CEO (SUPER_ADMIN, Org Owner, or CEO title).
 */
export const isEligibleManager = (emp) => {
  if (!emp) return false;

  // 1. Active user account requirement (having an active user account is sufficient)
  const isUserActive = Boolean(emp.userActive ?? emp.isUserActive);
  if (!isUserActive) return false;

  // 2. Disallowed employment statuses
  const disallowedStatuses = new Set([
    'DRAFT',
    'PENDING_APPROVAL',
    'PENDING_ONBOARDING',
    'ONGOING_ONBOARDING',
    'SUSPENDED',
    'TERMINATED',
    'RESIGNED',
    'OFFBOARDED',
    'ARCHIVED',
  ]);
  const status = String(emp.employmentStatus || emp.status || '').toUpperCase();
  if (disallowedStatuses.has(status)) return false;

  // 3. Must have "Manager" in role or job title, OR be CEO
  const role = String(emp.role || emp.systemRole || emp.userRole || '').toUpperCase();
  const jobTitle = String(emp.jobTitle || emp.job_title || '').trim();
  const empClass = String(emp.employeeClass || emp.employee_class || '').toUpperCase();

  const isCEO =
    role === 'SUPER_ADMIN' ||
    Boolean(emp.isSuperAdmin || emp.isOrgOwner || emp.is_organization_owner) ||
    /\bceo\b/i.test(jobTitle) ||
    /chief executive officer/i.test(jobTitle);

  if (isCEO) return true;

  // If the employee class is explicitly a non-manager class (e.g. TEAM MEMBER) and job title doesn't have manager,
  // they are not eligible even if a stale User.role of MANAGER exists.
  const hasManagerTitle = /\bmanager\b/i.test(jobTitle);
  const hasManagerClass = /MANAGER/i.test(empClass);

  if (empClass && !hasManagerClass && !hasManagerTitle) {
    return false;
  }

  const hasManagerInRole = role.includes('MANAGER') || hasManagerTitle || hasManagerClass;

  return hasManagerInRole;
};
