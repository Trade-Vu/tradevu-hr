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
