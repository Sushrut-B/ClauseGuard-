import dotenv from 'dotenv'
dotenv.config()

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

export const analyzeContract = async (content: string): Promise<RiskResult> => {
  const prompt = `
You are a contract risk analysis AI. Analyze the following contract and return a JSON response only - no markdown, no explanation, just raw JSON.

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
  const prompt = `
You are a contract lawyer AI. Rewrite the following risky contract clause to be fairer and safer for the receiving party.

Category of risk: ${category}
Why it is risky: ${reason}

Original clause:
"${clauseText}"

Rules:
- Keep the same general intent and subject matter
- Make it balanced and standard industry practice
- Return ONLY the rewritten clause text - no explanation, no quotes, no preamble
`
  const response = await fetch(
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