import { Router } from 'express'
import { authenticate } from '../middleware/auth'
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
import { Request, Response, NextFunction } from 'express'

const router = Router()

router.post('/upload', authenticate, requireRole('member'), upload.single('file'), uploadContract)
router.get('/', authenticate, listContracts)
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  await logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.viewed',
  })
  next()
}, getContract)
router.get('/:id/text', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  await logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.viewed',
  })
  next()
}, getContractText)
router.delete('/:id', authenticate, requireRole('member'), deleteContract)
router.patch('/:id/stage', authenticate, requireRole('member'), async (req: Request, res: Response, next: NextFunction) => {
  await logAudit({
    contractId: req.params.id,
    userId: req.user!.userId,
    userEmail: req.user!.email,
    action: 'contract.stage_changed',
    metadata: { stage: req.body.stage },
  })
  next()
}, updateLifecycleStage)
export default router