import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { analyzeContract } from '../services/geminiService'
import { Analysis } from '../models/analysis'

const router = Router()

const CONTRACT_SERVICE = process.env.CONTRACT_SERVICE_URL || 'http://localhost:3002'

// POST /ai/analyze/:contractId — fetch text from contract service, run Gemini, store result
router.post('/analyze/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { contractId } = req.params
  const token = req.headers.authorization!

  try {
    // Fetch extracted text from contract service
    const contractRes = await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/text`, {
      headers: { Authorization: token },
    })

    if (!contractRes.ok) {
      const err = (await contractRes.json()) as any
      res.status(contractRes.status).json({ success: false, error: err.error || 'Failed to fetch contract text' })
      return
    }

    const contractData = (await contractRes.json()) as any
    const { extractedText, originalName } = contractData.data

    if (!extractedText || extractedText.length < 50) {
      res.status(400).json({ success: false, error: 'Contract text too short to analyze' })
      return
    }

    // Run Gemini analysis
    const result = await analyzeContract(extractedText)

    // Store result
    const analysis = await Analysis.create({
      contractId,
      userId: req.user!.userId,
      overallScore: result.overallScore,
      summary: result.summary,
      clauses: result.clauses,
    })

    res.status(201).json({
      success: true,
      data: {
        id: analysis.id,
        contractId,
        originalName,
        overallScore: result.overallScore,
        summary: result.summary,
        clauses: result.clauses,
        analyzedAt: analysis.createdAt,
      },
    })
  } catch (err: any) {
    console.error('Analysis error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /ai/analysis/:contractId — retrieve stored analysis
router.get('/analysis/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analysis = await Analysis.findOne({
      where: { contractId: req.params.contractId, userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
    })

    if (!analysis) {
      res.status(404).json({ success: false, error: 'No analysis found for this contract' })
      return
    }

    res.json({ success: true, data: analysis })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router