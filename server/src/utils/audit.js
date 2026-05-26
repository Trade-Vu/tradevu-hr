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
export const createAuditLog = async ({
  actorId,
  entityType,
  entityId,
  action,
  previousValue,
  newValue,
  ipAddress
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        entityType,
        entityId,
        action,
        previousValue,
        newValue,
        ipAddress
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
