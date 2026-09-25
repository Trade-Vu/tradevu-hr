// Mirrors ../tradevu-hr-backend/src/modules/employees/constants/employment-status.ts.
// The backend enforces these rules on leave requests; the UI just avoids offering what it would refuse.

// Not yet onboarded: DRAFT -> PENDING_APPROVAL -> ... -> PROBATION/ACTIVE.
export const PRE_ONBOARDING_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'PENDING_ONBOARDING',
  'ONGOING_ONBOARDING',
];

// No longer with the organization (or record archived).
export const SEPARATED_STATUSES = ['TERMINATED', 'RESIGNED', 'OFFBOARDED', 'ARCHIVED'];

// A missing status is treated as DRAFT, matching the backend schema default.
const normalize = (status) => String(status || 'DRAFT').toUpperCase();

export const isOnboardedStatus = (status) => !PRE_ONBOARDING_STATUSES.includes(normalize(status));

export const isSeparatedStatus = (status) => SEPARATED_STATUSES.includes(normalize(status));

export const isLeaveEligibleStatus = (status) => isOnboardedStatus(status) && !isSeparatedStatus(status);
