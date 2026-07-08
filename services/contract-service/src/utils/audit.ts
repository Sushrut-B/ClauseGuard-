import { AuditLog, AuditAction } from '../models/auditLog'

export const logAudit = async (params: {
  contractId: string
  userId: string
  userEmail: string
  action: AuditAction
  metadata?: object
}) => {
  try {
    await AuditLog.create({
      contractId: params.contractId,
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      metadata: params.metadata ?? {},
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}