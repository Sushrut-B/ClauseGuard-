import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { PlaybookRule } from '../models/playbook'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rules = await PlaybookRule.findAll({ where: { userId: req.user!.userId } })
    res.json({ success: true, data: rules })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { text, category } = req.body
  if (!text) {
    res.status(400).json({ success: false, error: 'Rule text is required' })
    return
  }
  try {
    const rule = await PlaybookRule.create({
      userId: req.user!.userId,
      text,
      category: category || 'general'
    })
    res.status(201).json({ success: true, data: rule })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rule = await PlaybookRule.findOne({ where: { id: req.params.id, userId: req.user!.userId } })
    if (!rule) {
      res.status(404).json({ success: false, error: 'Rule not found' })
      return
    }
    await rule.destroy()
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
