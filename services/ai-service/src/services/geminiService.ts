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

const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 4): Promise<Response> => {
  let lastError: Error = new Error('Unknown error')
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.status !== 503 && response.status !== 429) {
      return response
    }
    const delay = Math.pow(2, attempt) * 2000 // 2s, 4s, 8s, 16s
    console.log(`Gemini ${response.status} - retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`)
    lastError = new Error(`Gemini unavailable after ${maxRetries} retries`)
    if (attempt < maxRetries) await sleep(delay)
  }
  throw lastError
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
  const res = await fetchWithRetry(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
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

export const analyzeContract = async (content: string, playbookRules: string[] = []): Promise<RiskResult> => {
  const playbookContext = playbookRules.length > 0 
    ? `\n\nCRITICAL PLAYBOOK RULES:\nThe user has defined the following strict company rules. You MUST flag any clause that violates these rules as HIGH severity:\n${playbookRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`
    : ''

  const fewShotContext = await getFewShotExamples()

  const prompt = `
You are a contract risk analysis AI. Analyze the following contract and return a JSON response only - no markdown, no explanation, just raw JSON.
${playbookContext}
${fewShotContext}
Identify risky clauses and score each one across these categories:
- liability: exposure to damages or losses
- termination: unfair or one-sided termination rights
- payment: unfavorable payment terms
- ip: intellectual property ownership risks
- dispute: dispute resolution that favors the other party

For each clause found, provide:
- text: the EXACT verbatim substring from the contract
- category: one of the 5 above
- score: 0-100 (100 = extremely risky)
- reason: why this is risky
- suggestion: how to improve it
- startIndex: character offset where this clause starts (0-based)
- endIndex: character offset where this clause ends (exclusive)

Also extract all important dates mentioned in the contract:
- label: human-readable description (e.g. "Contract Effective Date", "Payment Due", "Renewal Deadline")
- date: the date in ISO 8601 format (YYYY-MM-DD) if determinable, otherwise the raw text from the contract
- type: one of effective | expiry | renewal | payment | notice | other

Also extract all obligations - things each party is required to do:
- id: a unique short string like "obl_1", "obl_2" etc.
- party: who is obligated - "company", "contractor", or "both"
- action: clear plain English description of what must be done
- deadline: when it must be done (ISO date or plain text) or null if no deadline
- category: one of payment | delivery | reporting | confidentiality | compliance | other
- status: always "pending" for newly extracted obligations

Also provide:
- overallScore: 0-100 weighted average
- summary: 2-3 sentence plain English summary of the contract risk profile

Return ONLY this JSON structure:
{
  "overallScore": number,
  "summary": "string",
  "keyDates": [
    {
      "label": "string",
      "date": "string",
      "type": "effective|expiry|renewal|payment|notice|other"
    }
  ],
  "obligations": [
    {
      "id": "string",
      "party": "company|contractor|both",
      "action": "string",
      "deadline": "string or null",
      "category": "payment|delivery|reporting|confidentiality|compliance|other",
      "status": "pending"
    }
  ],
  "clauses": [
    {
      "text": "string",
      "category": "liability|termination|payment|ip|dispute",
      "score": number,
      "reason": "string",
      "suggestion": "string",
      "startIndex": number,
      "endIndex": number
    }
  ]
}

CONTRACT:
${content}
`
  const response = await fetchWithRetry(
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
  console.log('Gemini status:', response.status)
  if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('No response from Gemini')
  const clean = text.replace(/```json|```/g, '').trim()
  const result = JSON.parse(clean) as RiskResult

  result.clauses = result.clauses.map((clause) => {
    const idx = content.indexOf(clause.text)
    if (idx !== -1) {
      clause.startIndex = idx
      clause.endIndex = idx + clause.text.length
    }
    return clause
  })

  if (!result.keyDates) result.keyDates = []
  if (!result.obligations) result.obligations = []

  return result
}

export const rewriteClause = async (
  clauseText: string,
  category: string,
  reason: string
): Promise<string> => {
  const fewShotContext = await getFewShotExamples(category)
  const prompt = `
You are a contract lawyer AI. Rewrite the following risky contract clause to be fairer and safer for the receiving party.
${fewShotContext}

Category of risk: ${category}
Why it is risky: ${reason}

Original clause:
"${clauseText}"

Rules:
- Keep the same general intent and subject matter
- Make it balanced and standard industry practice
- Return ONLY the rewritten clause text - no explanation, no quotes, no preamble
`
  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  )
  const data = (await response.json()) as any
  if (!response.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('No rewrite returned from Gemini')
  return text
}