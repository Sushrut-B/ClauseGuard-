import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/requireRole'
import { AuditLog } from '../models/auditLog'
import { Contract } from '../models/contract'

const router = Router()

router.get('/:contractId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.contractId, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    const logs = await AuditLog.findAll({
      where: { contractId: req.params.contractId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    })
    res.json({ success: true, data: logs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router