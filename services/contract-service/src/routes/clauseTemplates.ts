import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { ClauseTemplate } from '../models/clauseTemplate'
import { Op } from 'sequelize'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, riskLevel, search } = req.query
    const where: any = {}
    if (category) where.category = category
    if (riskLevel) where.riskLevel = riskLevel
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { text: { [Op.iLike]: `%${search}%` } },
      ]
    }
    const templates = await ClauseTemplate.findAll({ where, order: [['category', 'ASC'], ['riskLevel', 'ASC']] })
    res.json({ success: true, data: templates })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const template = await ClauseTemplate.findByPk(req.params.id)
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' })
      return
    }
    res.json({ success: true, data: template })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router