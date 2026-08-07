import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

// Zod schemas compatible with Gemini Structured Output (No .nullable(), no .literal())
const keyDateSchema = z.object({
  label: z.string().describe('human-readable description of the date'),
  date: z.string().describe('the date in YYYY-MM-DD format, or empty string if unavailable'),
  type: z.enum(['effective', 'expiry', 'renewal', 'payment', 'notice', 'other']),
})

const obligationSchema = z.object({
  id: z.string(),
  party: z.enum(['company', 'contractor', 'both']),
  action: z.string().describe('description of what must be done'),
  deadline: z.string().describe('when it must be done (YYYY-MM-DD) or empty string if no deadline'),
  category: z.enum(['payment', 'delivery', 'reporting', 'confidentiality', 'compliance', 'other']),
  status: z.enum(['pending', 'in_progress', 'fulfilled', 'overdue']),
})

const clauseRiskSchema = z.object({
  text: z.string().describe('the EXACT verbatim substring from the contract'),
  category: z.enum(['liability', 'termination', 'payment', 'ip', 'dispute']),
  score: z.number().describe('risk score from 0 to 100'),
  reason: z.string().describe('why it is risky'),
  suggestion: z.string().describe('how to improve it'),
  startIndex: z.number().describe('default value 0'),
  endIndex: z.number().describe('default value 0'),
})

const riskResultSchema = z.object({
  overallScore: z.number(),
  summary: z.string(),
  keyDates: z.array(keyDateSchema),
  obligations: z.array(obligationSchema),
  clauses: z.array(clauseRiskSchema),
})

export type RiskResult = z.infer<typeof riskResultSchema>

export const analyzeContractWithLangChain = async (
  content: string,
  playbookRules: string[] = []
): Promise<RiskResult> => {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
  })

  const playbookContext = playbookRules.length > 0
    ? `\n\nCRITICAL PLAYBOOK RULES:\n${playbookRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`
    : ''

  const structuredModel = model.withStructuredOutput(riskResultSchema)

  const prompt = `You are a contract risk analysis assistant. Analyze the following contract.
Identify all risky clauses, important dates, and obligations. Set startIndex and endIndex to 0 for now.
${playbookContext}
CONTRACT:
${content}
`

  const result = await structuredModel.invoke(prompt) as RiskResult

  // Map start and end indices based on verbatim text matching
  result.clauses = (result.clauses || []).map((clause: any) => {
    const idx = content.indexOf(clause.text)
    if (idx !== -1) {
      clause.startIndex = idx
      clause.endIndex = idx + clause.text.length
    } else {
      clause.startIndex = 0
      clause.endIndex = 0
    }
    return clause
  })

  return result
}

export const rewriteClauseWithLangChain = async (
  clauseText: string,
  category: string,
  reason: string
): Promise<string> => {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
  })

  const prompt = `You are a contract lawyer AI. Rewrite the following risky contract clause to be fairer and safer for the receiving party.
Category of risk: ${category}
Why it is risky: ${reason}

Original clause:
"${clauseText}"

Rules:
- Keep the same general intent and subject matter
- Make it balanced and standard industry practice
- Return ONLY the rewritten clause text - no explanation, no quotes, no preamble
`

  const res = await model.invoke(prompt)
  return typeof res.content === 'string' ? res.content.trim() : JSON.stringify(res.content)
}
