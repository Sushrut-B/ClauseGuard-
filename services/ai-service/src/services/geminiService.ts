export interface ClauseRisk {
  text: string
  category: 'liability' | 'termination' | 'payment' | 'ip' | 'dispute'
  score: number
  reason: string
  suggestion: string
}

export interface RiskResult {
  overallScore: number
  summary: string
  clauses: ClauseRisk[]
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
- text: the exact clause or a short excerpt
- category: one of the 5 above
- score: 0-100 (100 = extremely risky)
- reason: why this is risky
- suggestion: how to improve it

Also provide:
- overallScore: 0-100 weighted average
- summary: 2-3 sentence plain English summary of the contract's risk profile

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
      "suggestion": "string"
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
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      }),
    }
  )

  const data = await response.json() as any
  console.log('Gemini HTTP status:', response.status)
  console.log('Gemini raw response:', JSON.stringify(data, null, 2))

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('No response from Gemini')

  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as RiskResult
}
