// Approval-step roles, mirroring APPROVER_ROLES in
// ../tradevu-hr-backend/src/modules/approvals/constants/approval-step.ts.
export const APPROVER_ROLE_OPTIONS = [
  { value: 'LINE_MANAGER', label: 'Line manager' },
  { value: 'HEAD_OF_DEPARTMENT', label: 'Head of department' },
  { value: 'HR_ADMIN', label: 'HR admin' },
  { value: 'SUPER_ADMIN', label: 'Super admin' },
  { value: 'OTHER', label: 'Other*' },
];

export const APPROVAL_STEP_SEQUENCE = [
  'LINE_MANAGER',
  'HEAD_OF_DEPARTMENT',
  'HR_ADMIN',
  'SUPER_ADMIN',
  'OTHER',
];

export const FULL_LEAVE_APPROVAL_FLOW = [
  { order: 1, role: 'LINE_MANAGER' },
  { order: 2, role: 'HEAD_OF_DEPARTMENT' },
  { order: 3, role: 'HR_ADMIN' },
  { order: 4, role: 'SUPER_ADMIN' },
  { order: 5, role: 'OTHER' },
];

export const DEFAULT_LEAVE_APPROVAL_STEPS = [
  { order: 1, role: 'LINE_MANAGER' },
];

// Normalizes roles for backward compatibility with legacy values
export const normalizeApprovalRole = (role) => {
  const upper = String(role || '').trim().toUpperCase();
  if (upper === 'MANAGER' || upper === 'LINE_MANAGER' || upper === 'LINEMANAGER') return 'LINE_MANAGER';
  if (upper === 'HOD' || upper === 'HEAD_OF_DEPARTMENT' || upper === 'DEPARTMENT_HEAD') return 'HEAD_OF_DEPARTMENT';
  if (upper === 'HR_ADMIN' || upper === 'HRADMIN' || upper === 'HR') return 'HR_ADMIN';
  if (upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN') return 'SUPER_ADMIN';
  if (upper === 'OTHER' || upper === 'OTHER*' || upper === 'FINANCE' || upper === 'FINANCE_ADMIN') return 'OTHER';
  return upper;
};

export const getApprovalRoleLabel = (role) => {
  const normalized = normalizeApprovalRole(role);
  return APPROVER_ROLE_OPTIONS.find((option) => option.value === normalized)?.label || normalized.replace(/_/g, ' ');
};

/** Sorted by order and renumbered 1..n, with roles normalized. */
export const normalizeApprovalSteps = (steps = []) =>
  [...(steps || [])]
    .filter((step) => step?.role)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((step, index) => ({ order: index + 1, role: normalizeApprovalRole(step.role) }));

/** "Line manager → Head of department → HR admin → Super admin → Other*" */
export const formatApprovalChain = (steps = []) =>
  normalizeApprovalSteps(steps).map((step) => getApprovalRoleLabel(step.role)).join(' → ');
