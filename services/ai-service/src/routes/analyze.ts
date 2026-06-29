import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { analyzeContract, rewriteClause } from '../services/geminiService'
import { Analysis } from '../models/analysis'

const router = Router()
const CONTRACT_SERVICE = process.env.CONTRACT_SERVICE_URL || 'http://localhost:3002'

router.post('/analyze/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { contractId } = req.params
  const token = req.headers.authorization!
  try {
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
    const result = await analyzeContract(extractedText)
    const analysis = await Analysis.create({
      contractId,
      userId: req.user!.userId,
      overallScore: result.overallScore,
      summary: result.summary,
      clauses: result.clauses.map((cl) => ({
        ...cl,
        severity: cl.score >= 70 ? 'high' : cl.score >= 40 ? 'medium' : 'low',
      })),
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

router.post('/rewrite', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { clauseText, category, reason } = req.body
  if (!clauseText || !category || !reason) {
    res.status(400).json({ success: false, error: 'clauseText, category and reason are required' })
    return
  }
  try {
    const rewritten = await rewriteClause(clauseText, category, reason)
    res.json({ success: true, data: { rewritten } })
  } catch (err: any) {
    console.error('Rewrite error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router