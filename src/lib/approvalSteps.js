// Approval-step roles, mirroring APPROVER_ROLES in
// ../tradevu-hr-backend/src/modules/approvals/constants/approval-step.ts.
export const APPROVER_ROLE_OPTIONS = [
  { value: 'MANAGER', label: "Employee's manager" },
  { value: 'HR_ADMIN', label: 'HR Admin' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

// Older workflows stored 'FINANCE', which matches no real role; the backend treats it as FINANCE_ADMIN.
export const normalizeApprovalRole = (role) => {
  const upper = String(role || '').trim().toUpperCase();
  return upper === 'FINANCE' ? 'FINANCE_ADMIN' : upper;
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

/** "Employee's manager → HR Admin" */
export const formatApprovalChain = (steps = []) =>
  normalizeApprovalSteps(steps).map((step) => getApprovalRoleLabel(step.role)).join(' → ');
