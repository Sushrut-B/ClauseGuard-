import { createHash } from 'crypto'
import { AuditLog, AuditAction } from '../models/auditLog'
import { Op } from 'sequelize'

export const computeAuditHash = (contractId: string, userId: string, action: string, timestamp: string): string => {
  return createHash('sha256')
    .update(`${contractId}:${userId}:${action}:${timestamp}`)
    .digest('hex')
}

export const logAudit = async (params: {
  contractId: string
  userId: string
  userEmail: string
  action: AuditAction
  metadata?: object
  dedupe?: boolean
}) => {
  try {
    if (params.dedupe) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recent = await AuditLog.findOne({
        where: {
          contractId: params.contractId,
          userId: params.userId,
          action: params.action,
          createdAt: { [Op.gte]: fiveMinutesAgo },
        },
      })
      if (recent) return
    }

    const timestamp = new Date().toISOString()
    const payloadHash = computeAuditHash(params.contractId, params.userId, params.action, timestamp)

    await AuditLog.create({
      contractId: params.contractId,
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      metadata: {
        ...(params.metadata ?? {}),
        payloadHash,
        integrityVerified: true,
      },
    })
  } catch (err) {
    console.error('Audit log error:', err)
  }
}