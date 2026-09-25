import { toTitleCase } from '@/lib/utils';

// The backend stores leave status as an UPPER_SNAKE_CASE enum
// (tradevu-hr-backend/src/modules/leave/constants/leave-status.ts) and never formats it for
// display — presentation casing is this layer's job. Older rows may still carry the legacy
// lowercase casings LeaveService used to write ('pending', 'approved', 'cancelled'), so
// always normalize before comparing or looking a status up in a map.

export const LEAVE_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PENDING_HR: 'PENDING_HR',
  PENDING_SUPER_ADMIN: 'PENDING_SUPER_ADMIN',
  NEEDS_INFORMATION: 'NEEDS_INFORMATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

// PENDING_APPROVAL is the only "pending" status the backend assigns — both on creation
// (leave-request.schema.ts default) and while progressing through a multi-level workflow
// (ApprovalsService.progressLeaveApproval re-sets PENDING_APPROVAL until the final level).
// PENDING_HR / PENDING_SUPER_ADMIN are legacy enum members that nothing currently writes,
// kept only so old records don't fall through unhandled.
export const PENDING_LEAVE_STATUSES = [
  LEAVE_STATUS.PENDING_APPROVAL,
  LEAVE_STATUS.PENDING_HR,
  LEAVE_STATUS.PENDING_SUPER_ADMIN,
];

// Legacy values folded onto their canonical equivalent. Bare 'PENDING' was the old
// single-level equivalent of PENDING_APPROVAL. Mirrors normalizeLeaveStatus() on the backend.
const LEGACY_STATUS_ALIASES = {
  PENDING: LEAVE_STATUS.PENDING_APPROVAL,
  CANCELED: LEAVE_STATUS.CANCELLED,
};

/** Uppercases and folds legacy aliases, so comparisons don't depend on how a row was written. */
export function normalizeLeaveStatus(status) {
  const upper = String(status || '').trim().toUpperCase();
  return LEGACY_STATUS_ALIASES[upper] || upper;
}

export function isPendingLeaveStatus(status) {
  return PENDING_LEAVE_STATUSES.includes(normalizeLeaveStatus(status));
}

// Labels for statuses whose words toTitleCase would otherwise run together oddly are spelled
// out; anything unrecognised still gets a readable Title Case fallback.
const LEAVE_STATUS_LABELS = {
  [LEAVE_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [LEAVE_STATUS.PENDING_HR]: 'Pending HR',
  [LEAVE_STATUS.PENDING_SUPER_ADMIN]: 'Pending Super Admin',
  [LEAVE_STATUS.NEEDS_INFORMATION]: 'Needs Information',
  [LEAVE_STATUS.APPROVED]: 'Approved',
  [LEAVE_STATUS.REJECTED]: 'Rejected',
  [LEAVE_STATUS.CANCELLED]: 'Cancelled',
};

/** 'APPROVED' -> 'Approved', 'PENDING_APPROVAL' -> 'Pending Approval'. */
export function formatLeaveStatus(status) {
  const normalized = normalizeLeaveStatus(status);
  if (!normalized) return '';
  return LEAVE_STATUS_LABELS[normalized] || toTitleCase(normalized);
}

const LEAVE_STATUS_BADGE_CLASSES = {
  [LEAVE_STATUS.PENDING_APPROVAL]: 'bg-amber-50 text-amber-700 border-amber-200',
  [LEAVE_STATUS.PENDING_HR]: 'bg-amber-50 text-amber-700 border-amber-200',
  [LEAVE_STATUS.PENDING_SUPER_ADMIN]: 'bg-amber-50 text-amber-700 border-amber-200',
  [LEAVE_STATUS.NEEDS_INFORMATION]: 'bg-blue-50 text-blue-700 border-blue-200',
  [LEAVE_STATUS.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [LEAVE_STATUS.REJECTED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [LEAVE_STATUS.CANCELLED]: 'bg-slate-50 text-slate-700 border-slate-200',
};

/** Tailwind classes for a leave status badge. Unknown statuses fall back to the pending style. */
export function getLeaveStatusBadgeClass(status) {
  return (
    LEAVE_STATUS_BADGE_CLASSES[normalizeLeaveStatus(status)] ||
    LEAVE_STATUS_BADGE_CLASSES[LEAVE_STATUS.PENDING_APPROVAL]
  );
}
