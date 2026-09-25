/**
 * pageRoutes.js - Centralized Page Links & Route Constants
 * 
 * Single source of truth for all client-side page links and navigation routes.
 * All route paths are strictly lowercase.
 */

const BASE_ROUTES = {
  // Public & Authentication
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/resetpassword',
  ACCEPT_INVITE: '/accept-invite',

  // Core & Setup
  DASHBOARD: '/dashboard',
  ROLE_SELECTION: '/roleselection',
  ORGANIZATION_SETUP: '/organizationsetup',

  // Employees & Self-Service
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employeedetail',
  EMPLOYEE_SELF_SERVICE: '/employeeselfservice',
  EMPLOYEE_PORTAL: '/employeeportal',

  // Approvals & Tasks
  PENDING_APPROVALS: '/pendingapprovals',
  TASK_MANAGER: '/taskmanager',

  // Leave & Attendance
  LEAVE_MANAGEMENT: '/leavemanagement',
  ALL_LEAVE_REQUESTS: '/allleaverequests',
  ATTENDANCE: '/attendance',

  // Assets & Communication
  ASSETS: '/assets',
  CHAT: '/chat',
  COMPANY_WALL: '/companywall',

  // Payroll & Finance
  PAYROLL: '/payroll',
  COMPENSATION: '/compensation',
  PAYROLL_ADJUSTMENTS: '/payrolladjustments',
  PAYROLL_REPORTS: '/payrollreports',
  PAYROLL_AI: '/payrollai',
  LOANS: '/loans',
  EXPENSES: '/expenses',

  // Recruitment & Lifecycle
  RECRUITMENT: '/recruitment',
  OFFBOARDING: '/offboarding',
  TEMPLATES: '/templates',

  // Training & Performance
  TRAINING: '/training',
  EVALUATIONS: '/evaluations',
  PERFORMANCE: '/performance',

  // Compliance & HR Letters
  COMPLIANCE_DASHBOARD: '/compliancedashboard',
  KNOWLEDGE_BANK: '/knowledgebank',
  HR_LETTERS: '/hrletters',
  HR_ASSISTANT: '/hrassistant',
  SURVEYS: '/surveys',

  // Analytics
  ANALYTICS: '/analytics',
  ADVANCED_ANALYTICS: '/advancedanalytics',
  ORGANOGRAM: '/organogram',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_APPROVAL_WORKFLOWS: '/settingsapprovalworkflows',
  SETTINGS_SHIFTS: '/settingsshifts',
  SETTINGS_DEPARTMENTS: '/settingsdepartments',
  SETTINGS_CLASSES: '/settingsclasses',
  SETTINGS_LEAVE_TYPES: '/settingsleavetypes',
  SETTINGS_PUBLIC_HOLIDAYS: '/settingspublicholidays',
  SETTINGS_STATUTORY: '/settingsstatutory',
  AUDIT_LOGS: '/auditlogs',
};

/**
 * Convert SNAKE_CASE key to PascalCase and camelCase aliases for developer ergonomics.
 * E.g., EMPLOYEE_SELF_SERVICE -> EmployeeSelfService, employeeSelfService
 */
const expandedRoutes = { ...BASE_ROUTES };

for (const [key, val] of Object.entries(BASE_ROUTES)) {
  const parts = key.toLowerCase().split('_');
  const pascal = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
  expandedRoutes[pascal] = val;
  expandedRoutes[camel] = val;
}

/**
 * Helper to build a page link with optional query parameters.
 * @param {string} routeKey - e.g. 'EMPLOYEES' or 'Employees' or '/employees'
 * @param {Record<string, any>|string} [params] - Query parameters as object or string
 * @returns {string} Fully formatted lowercase URL
 */
export function getPageUrl(routeKey, params) {
  let base = expandedRoutes[routeKey] || expandedRoutes[routeKey?.toUpperCase()] || routeKey;
  if (!base.startsWith('/')) {
    base = `/${base.toLowerCase().replace(/[-_ ]/g, '')}`;
  } else {
    base = base.toLowerCase();
  }

  if (!params) return base;
  if (typeof params === 'string') {
    const qs = params.startsWith('?') ? params.slice(1) : params;
    return `${base}?${qs}`;
  }
  const query = new URLSearchParams(params).toString();
  return query ? `${base}?${query}` : base;
}

export const PAGE_ROUTES = Object.freeze(expandedRoutes);
export const PAGE_LINKS = PAGE_ROUTES;
export const PAGE_URLS = PAGE_ROUTES;
export const ROUTES = PAGE_ROUTES;

export default PAGE_ROUTES;
