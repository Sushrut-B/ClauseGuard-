import dotenv from 'dotenv'
import { Correction } from '../models/correction'
dotenv.config()

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retrieve active learning corrections for few-shot examples
const getFewShotExamples = async (category?: string): Promise<string> => {
  try {
    const whereClause = category ? { category } : {}
    const corrections = await Correction.findAll({
      where: whereClause,
      limit: 3,
      order: [['createdAt', 'DESC']],
    })
    
    if (corrections.length === 0) return ''
    
    let examples = `\n\nFEW-SHOT LEARNING EXAMPLES (Corrected by Human Reviewers):\n`
    corrections.forEach((c, idx) => {
      examples += `
Example ${idx + 1}:
- Clause Text: "${c.clauseText}"
- Category: "${c.category}"
- Corrected Risk Severity/Outcome: ${c.correctedSeverity ? c.correctedSeverity.toUpperCase() : 'N/A'}
- Corrected Redline Suggestion: "${c.correctedSuggestion || 'N/A'}"
`
    })
    return examples
  } catch (err) {
    console.error('Failed to retrieve few-shot examples:', err)
    return ''
  }
}

import { geminiCircuitBreaker } from '../utils/circuitBreaker'

export const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
  return geminiCircuitBreaker.execute(async () => {
    let lastError: Error = new Error('Unknown error')
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        if (response.status !== 503 && response.status !== 429) {
          return response
        }
        lastError = new Error(`Gemini returned status ${response.status}`)
        const delay = Math.pow(2, attempt) * 1000
        console.warn(`[Gemini] ${response.status} received - retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`)
        if (attempt < maxRetries) await sleep(delay)
      } catch (err: any) {
        lastError = err
        const delay = Math.pow(2, attempt) * 1000
        console.warn(`[Gemini] Connection error: ${err.message} - retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`)
        if (attempt < maxRetries) await sleep(delay)
      }
    }
    throw lastError
  })
}


export interface ConflictResult {
  issue: string
  doc1Excerpt: string
  doc2Excerpt: string
  recommendation: string
}

export const crossCheckContracts = async (doc1Text: string, doc2Text: string): Promise<ConflictResult[]> => {
  const prompt = `
You are a legal AI specialized in cross-document conflict detection.
You will be provided with the text of Document 1 and Document 2.
Your task is to identify ANY direct contradictions, conflicting obligations, or mismatched terms between the two documents. (e.g. Doc 1 says Net-30 payment, Doc 2 says Net-60).

Document 1:
${doc1Text.substring(0, 30000)}

Document 2:
${doc2Text.substring(0, 30000)}

Return a JSON array of conflict objects. If no conflicts are found, return an empty array [].
Each object must have:
- issue: A clear, 1-sentence description of the contradiction.
- doc1Excerpt: The exact relevant quote from Document 1.
- doc2Excerpt: The exact relevant quote from Document 2.
- recommendation: A brief recommendation on how to resolve the conflict.

Return ONLY raw JSON array, no markdown.
`
  const apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const res = await fetchWithRetry(`${apiUrl}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error('Cross-check generation failed')
  const data = await res.json() as any
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
  try {
    return JSON.parse(raw) as ConflictResult[]
  } catch (e) {
    return []
  }
}

export interface ClauseRisk {
  text: string
  category: 'liability' | 'termination' | 'payment' | 'ip' | 'dispute'
  score: number
  reason: string
  suggestion: string
  startIndex: number
  endIndex: number
}

export interface KeyDate {
  label: string
  date: string
  type: 'effective' | 'expiry' | 'renewal' | 'payment' | 'notice' | 'other'
}

export interface Obligation {
  id: string
  party: 'company' | 'contractor' | 'both'
  action: string
  deadline: string | null
  category: 'payment' | 'delivery' | 'reporting' | 'confidentiality' | 'compliance' | 'other'
  status: 'pending' | 'in_progress' | 'fulfilled' | 'overdue'
}

export interface RiskResult {
  overallScore: number
  summary: string
  clauses: ClauseRisk[]
  keyDates: KeyDate[]
  obligations: Obligation[]
}

import { analyzeContractWithLangChain, rewriteClauseWithLangChain } from './langchainService'

export const analyzeContract = async (content: string, playbookRules: string[] = []): Promise<RiskResult> => {
  const fewShotText = await getFewShotExamples()
  return analyzeContractWithLangChain(content, playbookRules, fewShotText)
}

export const rewriteClause = async (
  clauseText: string,
  category: string,
  reason: string
): Promise<string> => {
  return rewriteClauseWithLangChain(clauseText, category, reason)
}