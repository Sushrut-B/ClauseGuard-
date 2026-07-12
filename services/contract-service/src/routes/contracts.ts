import { Router, Request, Response, NextFunction } from 'express'
import { authenticate } from '../middleware/auth'
import { Contract } from '../models/contract'
import { requireRole } from '../middleware/requireRole'
import { upload } from '../config/multer'
import {
  uploadContract,
  listContracts,
  getContract,
  getContractText,
  deleteContract,
  updateLifecycleStage,
} from '../controllers/contractController'
import { logAudit } from '../utils/audit'

const router = Router()

router.post('/upload', authenticate, requireRole('member'), upload.single('file'), uploadContract)
router.get('/', authenticate, listContracts)

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.viewed',
    dedupe: true,
  })
  next()
}, getContract)

router.get('/:id/text', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.viewed',
    dedupe: true,
  })
  next()
}, getContractText)

router.delete('/:id', authenticate, requireRole('member'), async (req: Request, res: Response, next: NextFunction) => {
  logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.deleted',
  })
  next()
}, deleteContract)

router.patch('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body
  const contract = await Contract.findOne({ where: { id: req.params.id } })
  if (!contract) { res.status(404).json({ success: false, error: 'Not found' }); return }
  await contract.update({ status })
  res.json({ success: true })
})

router.patch('/:id/stage', authenticate, requireRole('member'), async (req: Request, res: Response, next: NextFunction) => {
  logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.stage_changed',
    metadata: { stage: req.body.stage },
  })
  next()
}, updateLifecycleStage)

export default router