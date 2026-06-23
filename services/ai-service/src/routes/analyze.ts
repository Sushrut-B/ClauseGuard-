import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { analyzeContract } from '../services/geminiService'

const router = Router()

const analyzeSchema = z.object({
  content: z.string().min(50, 'Contract content too short'),
  contractId: z.string().optional(),
})

router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = analyzeSchema.safeParse(req.body)
    if (!parsed.success)
      return res.status(400).json({ success: false, error: parsed.error.errors[0].message })

    const { content, contractId } = parsed.data
    const result = await analyzeContract(content)

    res.json({
      success: true,
      data: {
        contractId: contractId || null,
        ...result,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/health', (_, res) => {
  res.json({ success: true, message: 'AI service healthy' })
})

export default router