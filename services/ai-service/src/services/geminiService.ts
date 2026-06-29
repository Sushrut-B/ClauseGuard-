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

export interface RiskResult {
  overallScore: number
  summary: string
  clauses: ClauseRisk[]
}

export const analyzeContract = async (content: string): Promise<RiskResult> => {
  const prompt = `
You are a contract risk analysis AI. Analyze the following contract and return a JSON response only — no markdown, no explanation, just raw JSON.

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

Also provide:
- overallScore: 0-100 weighted average
- summary: 2-3 sentence plain English summary of the contract risk profile

Return ONLY this JSON structure:
{
  "overallScore": number,
  "summary": "string",
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

  // Verify and correct offsets
  result.clauses = result.clauses.map((clause) => {
    const idx = content.indexOf(clause.text)
    if (idx !== -1) {
      clause.startIndex = idx
      clause.endIndex = idx + clause.text.length
    }
    return clause
  })

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
Why it's risky: ${reason}

Original clause:
"${clauseText}"

Rules:
- Keep the same general intent and subject matter
- Make it balanced and standard industry practice
- Return ONLY the rewritten clause text — no explanation, no quotes, no preamble
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