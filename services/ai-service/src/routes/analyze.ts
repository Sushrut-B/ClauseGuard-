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
router.post('/chat', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { messages, contractContext } = req.body
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ success: false, error: 'messages array required' })
    return
  }
  try {
    const systemPrompt = contractContext
      ? `You are LawBot, an AI legal assistant built into ClauseGuard. You are currently helping the user understand the following contract:\n\n${contractContext}\n\nAnswer questions about this contract clearly and concisely. Flag risks, explain clauses in plain English, and suggest improvements when asked.`
      : `You are LawBot, an AI legal assistant built into ClauseGuard, a contract risk intelligence platform. Help users understand contracts, legal terms, and risk analysis. Be concise, clear, and practical.`

    const geminiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    )
    const data = (await response.json()) as any
    if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`)
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!reply) throw new Error('No response from Gemini')
    res.json({ success: true, data: { reply } })
  } catch (err: any) {
    console.error('Chat error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})
export default router