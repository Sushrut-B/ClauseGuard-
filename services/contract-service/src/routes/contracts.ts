import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { Contract } from '../models/contract'

const router = Router()

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional().default(''),
  expiresAt: z.string().datetime().optional(),
})

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'active', 'expired', 'terminated']).optional(),
  expiresAt: z.string().datetime().optional(),
})

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const contracts = await Contract.findAll({
      where: { orgId: req.user!.orgId },
      order: [['createdAt', 'DESC']],
    })
    res.json({ success: true, data: contracts })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, orgId: req.user!.orgId },
    })
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' })
    res.json({ success: true, data: contract })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, validate(createSchema), async (req: Request, res: Response) => {
  try {
    const { title, content, expiresAt } = req.body
    const contract = await Contract.create({
      title,
      content,
      userId: req.user!.userId,
      orgId: req.user!.orgId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    res.status(201).json({ success: true, data: contract })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/:id', authenticate, validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, orgId: req.user!.orgId },
    })
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' })
    await contract.update(req.body)
    res.json({ success: true, data: contract })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, orgId: req.user!.orgId },
    })
    if (!contract) return res.status(404).json({ success: false, error: 'Contract not found' })
    await contract.destroy()
    res.json({ success: true, message: 'Contract deleted' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router