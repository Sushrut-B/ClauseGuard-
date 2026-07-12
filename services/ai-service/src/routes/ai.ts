import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { crossCheckContracts } from '../services/geminiService'

const router = Router()
const CONTRACT_SERVICE = process.env.CONTRACT_SERVICE_URL || 'http://localhost:3002'

router.post('/cross-check', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { contract1Id, contract2Id } = req.body
  if (!contract1Id || !contract2Id) {
    res.status(400).json({ success: false, error: 'contract1Id and contract2Id are required' })
    return
  }

  const token = req.headers.authorization!

  try {
    // Fetch text for doc 1
    const res1 = await fetch(`${CONTRACT_SERVICE}/contracts/${contract1Id}/text`, {
      headers: { Authorization: token },
    })
    if (!res1.ok) throw new Error('Failed to fetch contract 1')
    const data1 = await res1.json() as any
    const text1 = data1.data.extractedText

    // Fetch text for doc 2
    const res2 = await fetch(`${CONTRACT_SERVICE}/contracts/${contract2Id}/text`, {
      headers: { Authorization: token },
    })
    if (!res2.ok) throw new Error('Failed to fetch contract 2')
    const data2 = await res2.json() as any
    const text2 = data2.data.extractedText

    if (!text1 || !text2) throw new Error('One or both contracts have no extracted text')

    const conflicts = await crossCheckContracts(text1, text2)
    res.json({ success: true, data: conflicts })
  } catch (err: any) {
    console.error('Cross-check error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
