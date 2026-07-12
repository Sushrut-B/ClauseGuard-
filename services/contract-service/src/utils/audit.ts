import { AuditLog, AuditAction } from '../models/auditLog'
import { Op } from 'sequelize'

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