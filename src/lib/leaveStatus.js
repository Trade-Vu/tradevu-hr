// PENDING_APPROVAL is the only "pending" status the backend actually assigns — both on
// creation (leave-request.schema.ts default) and while progressing through a multi-level
// workflow (ApprovalsService.progressLeaveApproval always re-sets PENDING_APPROVAL until the
// final level). PENDING / PENDING_HR / PENDING_SUPER_ADMIN are legacy enum members that
// nothing currently writes, kept only so old records don't fall through unhandled.
export const PENDING_LEAVE_STATUSES = ['PENDING_APPROVAL', 'PENDING_HR', 'PENDING_SUPER_ADMIN', 'PENDING'];

export function isPendingLeaveStatus(status) {
  return PENDING_LEAVE_STATUSES.includes(String(status || '').toUpperCase());
}
