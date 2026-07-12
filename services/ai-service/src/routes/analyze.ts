import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { analyzeContract, rewriteClause } from '../services/geminiService'
import { Analysis } from '../models/analysis'
import { PlaybookRule } from '../models/playbook'

const router = Router()
const CONTRACT_SERVICE = process.env.CONTRACT_SERVICE_URL || 'http://localhost:3002'
const SCHEDULER_SERVICE = process.env.SCHEDULER_SERVICE_URL || 'http://localhost:3006'

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

    const rules = await PlaybookRule.findAll({ where: { userId: req.user!.userId } })
    const ruleTexts = rules.map(r => r.text)

    const result = await analyzeContract(extractedText, ruleTexts)
    const analysis = await Analysis.create({
      contractId,
      userId: req.user!.userId,
      overallScore: result.overallScore,
      summary: result.summary,
      keyDates: result.keyDates ?? [],
      obligations: result.obligations ?? [],
      clauses: result.clauses.map((cl) => ({
        ...cl,
        severity: cl.score >= 70 ? 'high' : cl.score >= 40 ? 'medium' : 'low',
      })),
    })

    // Auto-sync extracted key dates to the scheduler service
    if (result.keyDates && result.keyDates.length > 0) {
      for (const kd of result.keyDates) {
        try {
          let triggerAt = new Date(kd.date)
          if (isNaN(triggerAt.getTime()) || triggerAt.getTime() <= 0) {
            triggerAt = new Date()
            triggerAt.setDate(triggerAt.getDate() + 30) // Default to 30 days if invalid
          }
          await fetch(`${SCHEDULER_SERVICE}/reminders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
            body: JSON.stringify({
              contractId,
              type: kd.type === 'expiry' ? 'expiry' : kd.type === 'renewal' ? 'renewal' : 'custom',
              triggerAt: triggerAt.toISOString(),
              message: `Auto-extracted: ${kd.label} - ${kd.date}`,
            }),
          })
        } catch (syncErr) {
          console.error('Failed to sync obligation to calendar:', syncErr)
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: analysis.id,
        contractId,
        originalName,
        overallScore: result.overallScore,
        summary: result.summary,
        clauses: result.clauses,
        keyDates: result.keyDates ?? [],
        obligations: result.obligations ?? [],
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

router.post('/compare', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { contractIdA, contractIdB } = req.body
  if (!contractIdA || !contractIdB) {
    res.status(400).json({ success: false, error: 'contractIdA and contractIdB are required' })
    return
  }
  const token = req.headers.authorization!
  try {
    const [resA, resB] = await Promise.all([
      fetch(`${CONTRACT_SERVICE}/contracts/${contractIdA}/text`, { headers: { Authorization: token } }),
      fetch(`${CONTRACT_SERVICE}/contracts/${contractIdB}/text`, { headers: { Authorization: token } }),
    ])
    if (!resA.ok || !resB.ok) {
      res.status(400).json({ success: false, error: 'Failed to fetch one or both contracts' })
      return
    }
    const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]) as any[]
    const textA = dataA.data.extractedText
    const textB = dataB.data.extractedText
    const nameA = dataA.data.originalName
    const nameB = dataB.data.originalName

    const prompt = `
You are a contract comparison AI. Compare the following two contracts and return a JSON response only — no markdown, no explanation, just raw JSON.

CONTRACT A (${nameA}):
${textA}

CONTRACT B (${nameB}):
${textB}

Analyze the differences between the two contracts across these dimensions:
1. Overall risk change (did Contract B get better or worse than A?)
2. Clause-level changes (new clauses added, clauses removed, clauses that changed and got riskier or safer)
3. Key differences in: liability, termination, payment, ip, dispute

Return ONLY this JSON structure:
{
  "summary": "2-3 sentence plain English summary of how Contract B differs from Contract A",
  "riskScoreA": number,
  "riskScoreB": number,
  "verdict": "improved" | "worsened" | "neutral",
  "changes": [
    {
      "category": "liability|termination|payment|ip|dispute|other",
      "type": "added" | "removed" | "modified",
      "severity": "high" | "medium" | "low",
      "description": "what changed",
      "textA": "relevant text from Contract A or null if added",
      "textB": "relevant text from Contract B or null if removed"
    }
  ]
}
`
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    )
    const data = (await response.json()) as any
    if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) throw new Error('No response from Gemini')
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    res.json({ success: true, data: { ...result, nameA, nameB } })
  } catch (err: any) {
    console.error('Compare error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/obligations/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { obligationId, status } = req.body
  const validStatuses = ['pending', 'in_progress', 'fulfilled', 'overdue']
  if (!obligationId || !status || !validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: 'obligationId and valid status required' })
    return
  }
  try {
    const analysis = await Analysis.findOne({
      where: { contractId: req.params.contractId, userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
    })
    if (!analysis) {
      res.status(404).json({ success: false, error: 'Analysis not found' })
      return
    }
    const obligations = (analysis.get('obligations') as any[]) ?? []
    const updated = obligations.map((o: any) =>
      o.id === obligationId ? { ...o, status } : o
    )
    await analysis.update({ obligations: updated })
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})
router.get('/benchmark/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const current = await Analysis.findOne({
      where: { contractId: req.params.contractId, userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
    })
    if (!current) {
      res.status(404).json({ success: false, error: 'Analysis not found' })
      return
    }
    const all = await Analysis.findAll({
      where: { userId: req.user!.userId },
      attributes: ['overallScore', 'clauses', 'contractId'],
    })
    const scores = all.map((a: any) => a.overallScore).filter((s: number) => s != null)
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0
    const below = scores.filter((s: number) => s > current.overallScore).length
    const percentile = scores.length > 1
      ? Math.round((below / (scores.length - 1)) * 100)
      : 50

    const catTotals: Record<string, number[]> = {
      liability: [], termination: [], payment: [], ip: [], dispute: []
    }
    all.forEach((a: any) => {
      const clauses = (a.clauses as any[]) ?? []
      clauses.forEach((cl: any) => {
        if (catTotals[cl.category]) catTotals[cl.category].push(cl.score)
      })
    })
    const catAvg: Record<string, number> = {}
    Object.entries(catTotals).forEach(([cat, scores]) => {
      catAvg[cat] = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
    })

    const currentCatAvg: Record<string, number> = {}
    const currentClauses = (current.get('clauses') as any[]) ?? []
    const currentCatTotals: Record<string, number[]> = {
      liability: [], termination: [], payment: [], ip: [], dispute: []
    }
    currentClauses.forEach((cl: any) => {
      if (currentCatTotals[cl.category]) currentCatTotals[cl.category].push(cl.score)
    })
    Object.entries(currentCatTotals).forEach(([cat, scores]) => {
      currentCatAvg[cat] = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
    })

    res.json({
      success: true,
      data: {
        currentScore: current.overallScore,
        avgScore,
        percentile,
        totalContracts: scores.length,
        categoryBenchmark: Object.keys(catAvg).map(cat => ({
          category: cat,
          currentScore: currentCatAvg[cat] ?? 0,
          avgScore: catAvg[cat],
        })),
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})
router.post('/reanalyze/:contractId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { contractId } = req.params
  const token = req.headers.authorization!
  try {
    // Fetch contract text
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

    // Update contract status to processing
    await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/status`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing' }),
    })

    // Run analysis
    const result = await analyzeContract(extractedText)

    // Delete existing analysis if any
    const existing = await Analysis.findOne({
      where: { contractId, userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
    })
    if (existing) await existing.destroy()

    const analysis = await Analysis.create({
      contractId,
      userId: req.user!.userId,
      overallScore: result.overallScore,
      summary: result.summary,
      keyDates: result.keyDates ?? [],
      obligations: result.obligations ?? [],
      clauses: result.clauses.map((cl) => ({
        ...cl,
        severity: cl.score >= 70 ? 'high' : cl.score >= 40 ? 'medium' : 'low',
      })),
    })

    // Update contract status to analyzed
    await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/status`, {
      method: 'PATCH',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'analyzed' }),
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
        keyDates: result.keyDates ?? [],
        obligations: result.obligations ?? [],
        analyzedAt: analysis.createdAt,
      },
    })
  } catch (err: any) {
    console.error('Reanalysis error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router