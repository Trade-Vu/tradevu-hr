import { toTitleCase } from './utils';

/**
 * Centralized Role Helpers for Tradevu HR
 * Handles case-insensitivity and dual-role checks consistently.
 */

export const getNormalizedRole = (user) => {
  return (user?.role || '').toUpperCase();
};

/**
 * Formats raw role enums into human-readable Title Case labels.
 * Examples:
 *  - 'LINE_MANAGER' -> 'Line Manager'
 *  - 'HEAD_OF_DEPARTMENT' -> 'Head Of Department'
 *  - 'HR_ADMIN' -> 'HR Admin'
 *  - 'SUPER_ADMIN' -> 'Super Admin'
 *  - 'FINANCE_ADMIN' -> 'Finance Admin'
 */
const ROLE_DISPLAY_NAMES = {
  LINE_MANAGER: 'Line Manager',
  HEAD_OF_DEPARTMENT: 'Head Of Department',
  HR_ADMIN: 'HR Admin',
  SUPER_ADMIN: 'Super Admin',
  FINANCE_ADMIN: 'Finance Admin',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  ADMIN: 'Admin',
  OTHER: 'Custom Approver',
};

export const formatRole = (role) => {
  if (!role) return '';
  const upper = String(role).trim().toUpperCase();
  return ROLE_DISPLAY_NAMES[upper] || toTitleCase(role);
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
  if (!user) return false;
  const role = getNormalizedRole(user);
  if (role === 'MANAGER' || role.includes('MANAGER')) return true;
  if (Boolean(user.isManager || user.canManage || user.canApproveLeave)) return true;

  const empClass = String(
    user.employeeClass ||
    user.employee_class ||
    user.employeeId?.employeeClass ||
    user.employeeId?.employee_class ||
    ''
  ).toUpperCase();

  if (/MANAGER/i.test(empClass)) return true;
  if (user.employeeId?.canManage || user.employeeId?.canApproveLeave) return true;

  return false;
};

export const isEmployee = (user) => {
  const role = getNormalizedRole(user);
  return role === 'EMPLOYEE';
};

/**
 * Checks whether an employee record or user has authority to approve leave requests
 * based on their assigned employee class configuration.
 */
export const canEmployeeClassApproveLeave = (employeeOrUser, classConfigurations = null) => {
  if (!employeeOrUser) return false;

  const employeeClassification = String(
    employeeOrUser.employeeClass ||
    employeeOrUser.employee_class ||
    employeeOrUser.employeeId?.employeeClass ||
    employeeOrUser.employeeId?.employee_class ||
    ''
  ).trim().toUpperCase();

  if (!employeeClassification) {
    // If no employee class is set, default to checking explicit properties or manager regex
    return Boolean(
      employeeOrUser.canApproveLeave ??
      employeeOrUser.employeeId?.canApproveLeave ??
      /MANAGER/i.test(employeeOrUser.role || '')
    );
  }

  if (Array.isArray(classConfigurations)) {
    const matchedClassConfiguration = classConfigurations.find((configuredClass) => {
      const configuredClassName = String(
        configuredClass?.name || configuredClass?.value || configuredClass || ''
      ).trim().toUpperCase();
      return configuredClassName === employeeClassification;
    });

    if (matchedClassConfiguration && typeof matchedClassConfiguration.canApproveLeave === 'boolean') {
      return matchedClassConfiguration.canApproveLeave;
    }
  }

  // Fallback to explicit property on employee or regex heuristic
  return Boolean(
    employeeOrUser.canApproveLeave ??
    employeeOrUser.employeeId?.canApproveLeave ??
    /MANAGER/i.test(employeeClassification)
  );
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
 * 4. Must have an assigned employee class with permission canManage: true (or non-owner Super Admin / CEO).
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

  // 4. Must have managerial employee class with canManage: true, OR non-owner Super Admin / CEO
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
 * Output: Name — Job Title • Department [(Head of Dept)] [[Leave routed to HR]]
 */
export const formatManagerOption = (
  employeeCandidate,
  departmentList = [],
  employeeClassConfigurations = []
) => {
  if (!employeeCandidate) return { value: '', label: '' };
  const employeeId = String(employeeCandidate.id || employeeCandidate._id || '');
  const employeeDepartmentId = String(employeeCandidate.departmentId || employeeCandidate.department_id || '');
  const matchedDepartment = departmentList.find(
    (departmentItem) => String(departmentItem.id || departmentItem._id || '') === employeeDepartmentId
  );
  const departmentName =
    employeeCandidate.departmentName ||
    employeeCandidate.department_name ||
    matchedDepartment?.name ||
    (employeeCandidate.isSuperAdmin ? 'Executive' : 'General');

  const isHeadOfDepartment = departmentList.some((departmentItem) => {
    const managerReference = departmentItem.managerId;
    const departmentHeadId = managerReference
      ? String(managerReference._id || managerReference.id || (typeof managerReference === 'string' ? managerReference : ''))
      : null;
    return departmentHeadId === employeeId;
  });

  let formattedLabel =
    employeeCandidate.fullName ||
    employeeCandidate.full_name ||
    `${employeeCandidate.firstName || ''} ${employeeCandidate.lastName || ''}`.trim() ||
    'Unknown';

  const jobTitle = employeeCandidate.jobTitle || employeeCandidate.job_title;
  if (jobTitle) {
    formattedLabel += ` — ${jobTitle}`;
  }
  formattedLabel += ` • ${departmentName}`;
  if (isHeadOfDepartment) {
    formattedLabel += ` (Head of Dept)`;
  }

  if (Array.isArray(employeeClassConfigurations) && employeeClassConfigurations.length > 0) {
    const hasLeaveApprovalAuthority = canEmployeeClassApproveLeave(
      employeeCandidate,
      employeeClassConfigurations
    );
    if (!hasLeaveApprovalAuthority) {
      formattedLabel += ` [Leave routed to HR]`;
    }
  }

  return {
    value: employeeId,
    label: formattedLabel,
  };
};
