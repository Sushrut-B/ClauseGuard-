import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { generateStitchUI } from '../services/stitchService'

const router = Router()

router.post('/generate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { prompt } = req.body

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ success: false, error: 'A valid text prompt is required' })
    return
  }

  try {
    const result = await generateStitchUI(prompt)
    res.json({ success: true, data: result })
  } catch (err: any) {
    console.error('[StitchRoute] UI generation error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
