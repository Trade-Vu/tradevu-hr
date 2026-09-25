import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { isSuperAdmin, isAdmin, isManager, isFinanceAdmin } from '@/lib/roleUtils';
import { PAGE_ROUTES } from '@/constants/pageRoutes';
import { toast } from 'sonner';

/**
 * Route definitions and access control
 */
const ADMIN_ONLY_PAGES = new Set([
  'employees',
  'employeedetail',
  'offboarding',
  'recruitment',
  'templates',
  'compliancedashboard',
  'analytics',
  'advancedanalytics',
  'organogram',
  'assets',
  'settings',
  'settingsapprovalworkflows',
  'settingsshifts',
  'settingsdepartments',
  'settingsclasses',
  'settingsleavetypes',
  'settingspublicholidays',
  'auditlogs',
]);

const FINANCE_OR_ADMIN_PAGES = new Set([
  'payroll',
  'compensation',
  'payrolladjustments',
  'payrollreports',
  'payrollai',
  'settingsstatutory',
]);

const MANAGER_OR_ADMIN_PAGES = new Set([
  'pendingapprovals',
  'allleaverequests',
]);

const SUPER_ADMIN_ONLY_PAGES = new Set([
  'organizationsetup',
]);

const EMPLOYEE_ONLY_PAGES = new Set([
  'employeeselfservice',
  'employeeportal',
]);

function UnauthorizedRedirect({ to, message = "You do not have permission to access that page." }) {
  useEffect(() => {
    toast.error(message, { id: 'unauthorized-route-toast' });
  }, [message]);

  return <Navigate to={to} replace />;
}

export function RouteGuard({ pageKey, children }) {
  const { user, viewMode } = useAuth();
  const normalizedKey = (pageKey || '').toLowerCase();

  const userIsSuperAdmin = isSuperAdmin(user);
  const userIsAdmin = isAdmin(user);
  const userIsFinance = isFinanceAdmin(user);
  const userIsManager = isManager(user);
  const userIsHrAdmin = user?.role === 'HR_ADMIN';

  // Effective view mode: employees and HR admins who switched to EMPLOYEE view
  const isEmployeeView = !userIsSuperAdmin && (!userIsAdmin || viewMode === 'EMPLOYEE');

  // 1. Check Super Admin Only Pages
  if (SUPER_ADMIN_ONLY_PAGES.has(normalizedKey) && !userIsSuperAdmin) {
    return <UnauthorizedRedirect to={isEmployeeView ? PAGE_ROUTES.EMPLOYEE_SELF_SERVICE : PAGE_ROUTES.DASHBOARD} />;
  }

  // 2. Check Super Admin access to Employee Only Pages
  if (userIsSuperAdmin && EMPLOYEE_ONLY_PAGES.has(normalizedKey)) {
    return <Navigate to={PAGE_ROUTES.DASHBOARD} replace />;
  }

  // 3. Check Role Selection: Only HR_ADMIN who can switch views
  if (normalizedKey === 'roleselection') {
    if (!userIsHrAdmin || userIsSuperAdmin) {
      return <Navigate to={userIsSuperAdmin ? PAGE_ROUTES.DASHBOARD : PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace />;
    }
  }

  // 4. Check Dashboard / Home in Employee View
  if (isEmployeeView && (normalizedKey === 'dashboard' || normalizedKey === 'home')) {
    return <Navigate to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} replace />;
  }

  // 5. Check Admin-Only Pages
  if (ADMIN_ONLY_PAGES.has(normalizedKey)) {
    const hasAdminAccess = userIsSuperAdmin || (userIsAdmin && !isEmployeeView);
    if (!hasAdminAccess) {
      return <UnauthorizedRedirect to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} />;
    }
  }

  // 6. Check Finance or Admin Pages
  if (FINANCE_OR_ADMIN_PAGES.has(normalizedKey)) {
    const hasFinanceOrAdminAccess = userIsSuperAdmin || ((userIsAdmin || userIsFinance) && !isEmployeeView);
    if (!hasFinanceOrAdminAccess) {
      return <UnauthorizedRedirect to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} />;
    }
  }

  // 7. Check Manager or Admin Pages (Pending Approvals, All Leave Requests)
  if (MANAGER_OR_ADMIN_PAGES.has(normalizedKey)) {
    const hasApprovalAccess = userIsSuperAdmin || userIsAdmin || userIsManager;
    if (!hasApprovalAccess) {
      return <UnauthorizedRedirect to={PAGE_ROUTES.EMPLOYEE_SELF_SERVICE} />;
    }
  }

  return children;
}

export default RouteGuard;
