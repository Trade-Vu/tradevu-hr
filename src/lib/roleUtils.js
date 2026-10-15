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
 * 1. Must NOT be the organization owner (organization owners are not listed as managers to report to).
 * 2. Must not be in DRAFT, PENDING_APPROVAL, ONGOING_ONBOARDING, SUSPENDED, or separated employment statuses.
 *    (PENDING_ONBOARDING managers are allowed).
 * 3. Must have an active user account (or be in PENDING_ONBOARDING).
 * 4. Must have Manager role or managerial employee class (or non-owner Super Admin / CEO).
 *    Job title is not used for eligibility filtering.
 */
export const isEligibleManager = (emp, classConfigs = null) => {
  if (!emp) return false;

  // 1. Exclude the organization owner
  if (Boolean(emp.isOrgOwner || emp.is_organization_owner)) return false;

  const status = String(emp.employmentStatus || emp.status || '').toUpperCase();
  const isPendingOnboarding = status === 'PENDING_ONBOARDING';

  // 2. Disallowed employment statuses (PENDING_ONBOARDING is explicitly allowed)
  const disallowedStatuses = new Set([
    'DRAFT',
    'PENDING_APPROVAL',
    'ONGOING_ONBOARDING',
    'SUSPENDED',
    'TERMINATED',
    'RESIGNED',
    'OFFBOARDED',
    'ARCHIVED',
  ]);
  if (disallowedStatuses.has(status)) return false;

  // 3. Active user account requirement (active user account is sufficient; PENDING_ONBOARDING is permitted)
  const isUserActive = Boolean(emp.userActive ?? emp.isUserActive);
  if (!isUserActive && !isPendingOnboarding) return false;

  // 4. Must have managerial role or employee class, OR non-owner Super Admin / CEO
  const role = String(emp.role || emp.systemRole || emp.userRole || '').toUpperCase();
  const empClass = String(emp.employeeClass || emp.employee_class || '').toUpperCase();

  const isSuperAdminOrCEO = (role === 'SUPER_ADMIN' || emp.isSuperAdmin) && !emp.isOrgOwner;
  if (isSuperAdminOrCEO) return true;

  // Check if class config explicitly grants canManage
  let hasClassCanManage = false;
  if (Array.isArray(classConfigs) && empClass) {
    const matched = classConfigs.find(
      (c) => String(c.value || c.name || '').toUpperCase() === empClass
    );
    if (matched && typeof matched.canManage === 'boolean') {
      hasClassCanManage = matched.canManage;
    } else {
      hasClassCanManage = /MANAGER/i.test(empClass);
    }
  } else {
    hasClassCanManage = Boolean(emp.canManage ?? /MANAGER/i.test(empClass));
  }

  // Only users with an assigned employee class that has the permission of canManage
  // (or non-owner CEO / Super Admin handled above) can be selected as manager.
  if (!empClass || !hasClassCanManage) {
    return false;
  }

  return true;
};

/**
 * Formats an employee option for manager dropdown selects.
 * Output: Name — Job Title • Department [(Head of Dept)]
 */
export const formatManagerOption = (emp, departments = []) => {
  if (!emp) return { value: '', label: '' };
  const empId = String(emp.id || emp._id || '');
  const empDeptId = String(emp.departmentId || emp.department_id || '');
  const deptObj = departments.find((d) => String(d.id || d._id || '') === empDeptId);
  const deptName =
    emp.departmentName ||
    emp.department_name ||
    deptObj?.name ||
    (emp.isSuperAdmin ? 'Executive' : 'General');

  const isHOD = departments.some((d) => {
    const m = d.managerId;
    const headId = m ? String(m._id || m.id || (typeof m === 'string' ? m : '')) : null;
    return headId === empId;
  });

  let label = emp.fullName || emp.full_name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown';
  const jobTitle = emp.jobTitle || emp.job_title;
  if (jobTitle) {
    label += ` — ${jobTitle}`;
  }
  label += ` • ${deptName}`;
  if (isHOD) {
    label += ` (Head of Dept)`;
  }

  return {
    value: empId,
    label,
  };
};
