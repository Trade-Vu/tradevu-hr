import { prisma } from '../db.js';

/**
 * Creates an audit log entry in the database.
 * @param {Object} params
 * @param {String} params.actorId - The user ID who performed the action
 * @param {String} params.entityType - The type of entity affected (e.g. "Employee", "LeaveRequest")
 * @param {String} params.entityId - The ID of the affected entity
 * @param {String} params.action - The action performed (e.g. "CREATE", "UPDATE", "DELETE")
 * @param {Object} [params.previousValue] - The previous state of the entity
 * @param {Object} [params.newValue] - The new state of the entity
 * @param {String} [params.ipAddress] - The IP address of the actor
 */
import { AuditEmitterService } from '../services/AuditEmitterService.js';

export const createAuditLog = async ({
  userId,
  organizationId,
  entityType,
  entityId,
  action,
  details,
  ipAddress,
  prisma: providedPrisma // Deprecated: no longer used since emitter handles DB connection independently
}) => {
  AuditEmitterService.emit('AUDIT_LOG_CREATED', {
    userId,
    organizationId,
    action,
    entityType,
    entityId,
    details,
    ipAddress
  });
};

/**
 * Creates an ApprovalRecord for tracking the approval engine steps.
 */
export const recordApprovalEvent = async ({
  entityType,
  entityId,
  approverUserId,
  action,
  comments,
  previousStatus
}) => {
  const data = {
    entityType,
    entityId,
    approverUserId,
    action,
    comments,
    previousStatus
  };
  
  // Add specific foreign keys if needed
  if (entityType === 'LeaveRequest') data.leaveRequestId = entityId;
  if (entityType === 'PayrollRun') data.payrollRunId = entityId;

  AuditEmitterService.emit('APPROVAL_RECORD_CREATED', data);
};
