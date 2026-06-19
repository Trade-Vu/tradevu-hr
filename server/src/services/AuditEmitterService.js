import { EventEmitter } from 'events';
import { prisma } from '../db.js';

class AuditEmitter extends EventEmitter {}

export const AuditEmitterService = new AuditEmitter();

// Listener for general audit logs
AuditEmitterService.on('AUDIT_LOG_CREATED', async (payload) => {
  try {
    await prisma.auditLog.create({
      data: payload
    });
  } catch (error) {
    console.error('AuditEmitterService [AUDIT_LOG_CREATED] Failed to write audit log to DB:', error);
  }
});

// Listener for approval record events
AuditEmitterService.on('APPROVAL_RECORD_CREATED', async (payload) => {
  try {
    await prisma.approvalRecord.create({
      data: payload
    });
  } catch (error) {
    console.error('AuditEmitterService [APPROVAL_RECORD_CREATED] Failed to write approval record to DB:', error);
  }
});
