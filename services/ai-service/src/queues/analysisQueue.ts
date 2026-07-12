import Bull from "bull"
import { analyzeContract } from "../services/geminiService"
import { Analysis } from "../models/analysis"
import { retrieveChunks } from "../utils/retriever"
import { semanticChunker } from "../utils/chunker"
import { Correction } from "../models/correction"

const CONTRACT_SERVICE = process.env.CONTRACT_SERVICE_URL || 'http://localhost:3002'
const SCHEDULER_SERVICE = process.env.SCHEDULER_SERVICE_URL || 'http://localhost:3006'

export const analysisQueue = new Bull("analysis-queue", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
})

interface Clause {
  text: string
  category: string
  score: number
  reason: string
  suggestion: string
  severity: 'high' | 'medium' | 'low'
  startIndex: number
  endIndex: number
  pageNumber?: number
}

analysisQueue.process(async (job) => {
  const { contractId, userId, token, playbookRules } = job.data
  console.log(`[Worker] Started risk analysis job for contract: ${contractId}`)
  
  try {
    // 1. Fetch text and pages from contract-service
    const contractRes = await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/text`, {
      headers: { Authorization: token },
    })
    
    if (!contractRes.ok) {
      throw new Error(`Failed to fetch contract text: ${contractRes.statusText}`)
    }
    
    const contractData = (await contractRes.json()) as any
    const { extractedText, pages } = contractData.data

    if (!extractedText || extractedText.length < 50) {
      throw new Error("Contract text too short to analyze")
    }

    // 2. Run general category risk analysis using Gemini
    console.log(`[Worker] Running standard Gemini analysis...`)
    const result = await analyzeContract(extractedText)

    // Map severities for general clauses
    const finalClauses: Clause[] = (result.clauses || []).map((cl: any) => ({
      text: cl.text,
      category: cl.category,
      score: cl.score,
      reason: cl.reason,
      suggestion: cl.suggestion,
      severity: cl.score >= 70 ? 'high' : cl.score >= 40 ? 'medium' : 'low',
      startIndex: cl.startIndex || 0,
      endIndex: cl.endIndex || 0,
    }))

    // 3. Local RAG Playbook Compliance Verification
    if (playbookRules && playbookRules.length > 0) {
      console.log(`[Worker] Running RAG Playbook compliance checks for ${playbookRules.length} rules...`)
      const chunks = semanticChunker(extractedText)
      
      for (const rule of playbookRules) {
        // Retrieve the top 2 relevant chunks for the rule
        const retrieved = retrieveChunks(rule, chunks, 2)
        const bestMatch = retrieved[0]

        // Fallback: Check if we have sufficient context / match similarity
        if (!bestMatch || bestMatch.score < 0.15) {
          console.log(`[Worker] Low confidence fallback triggered for rule: "${rule}" (Score: ${bestMatch?.score || 0})`)
          finalClauses.push({
            text: "No matching clause found in the document.",
            category: "dispute",
            score: 50,
            reason: `Insufficient Evidence: We could not retrieve any relevant clauses matching your Playbook rule: "${rule}". Low confidence check — recommend manual review.`,
            suggestion: "Please manually review the contract to confirm if this requirement is missing or violated.",
            severity: "medium",
            startIndex: 0,
            endIndex: 0,
          })
        } else {
          // Rule compliance checks via focused prompt
          console.log(`[Worker] Evaluating compliance on retrieved chunk (Similarity: ${bestMatch.score.toFixed(3)})`)
          
          let complianceFewShots = ''
          try {
            const corrections = await Correction.findAll({
              where: { category: 'liability' },
              limit: 2,
              order: [['createdAt', 'DESC']],
            })
            if (corrections.length > 0) {
              complianceFewShots = '\n\nFEW-SHOT EXAMPLES (Corrected by Human Reviewers):\n'
              corrections.forEach((c, idx) => {
                complianceFewShots += `
Example ${idx + 1}:
- Excerpt Text: "${c.clauseText}"
- Corrected Severity: ${c.correctedSeverity ? c.correctedSeverity.toUpperCase() : 'N/A'}
- Corrected Suggestion: "${c.correctedSuggestion || 'N/A'}"
`
              })
            }
          } catch (err) {
            console.error('Failed to load few-shots for compliance checks:', err)
          }

          const compliancePrompt = `
You are a legal compliance AI. Evaluate if the following contract clause complies with the Playbook Rule.
${complianceFewShots}

Playbook Rule: "${rule}"
Contract Clause: "${bestMatch.chunk}"

If the clause violates or contradicts the Playbook Rule, flag it as risky by providing a severity score (40-100), a reason for violation, and a suggestion to fix it.
If it complies perfectly or is irrelevant, return score: 0, violates: false.

Return ONLY this raw JSON format (no markdown, no preamble):
{
  "violates": boolean,
  "score": number,
  "reason": "string describing why it violates",
  "suggestion": "string suggestion to make it comply"
}
`
          try {
            const complianceRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: compliancePrompt }] }],
                  generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
                }),
              }
            )
            
            if (complianceRes.ok) {
              const data = await complianceRes.json() as any
              const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
              if (rawText) {
                const clean = rawText.replace(/```json|```/g, '').trim()
                const evalResult = JSON.parse(clean)
                if (evalResult.violates && evalResult.score > 0) {
                  const idx = extractedText.indexOf(bestMatch.chunk)
                  finalClauses.push({
                    text: bestMatch.chunk,
                    category: "liability",
                    score: evalResult.score,
                    reason: `Playbook Violation: ${evalResult.reason}`,
                    suggestion: evalResult.suggestion,
                    severity: evalResult.score >= 70 ? 'high' : evalResult.score >= 40 ? 'medium' : 'low',
                    startIndex: idx !== -1 ? idx : 0,
                    endIndex: idx !== -1 ? idx + bestMatch.chunk.length : 0,
                  })
                }
              }
            }
          } catch (ruleErr: any) {
            console.error(`[Worker] Playbook check failed for rule "${rule}":`, ruleErr.message)
          }
        }
      }
    }

    // 4. Source-Grounded Citations Page Matching
    console.log(`[Worker] Performing page citations matching...`)
    const enrichedClauses = finalClauses.map((clause) => {
      let pageNumber = 1
      if (pages && pages.length > 0) {
        const cleanStr = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
        const targetClean = cleanStr(clause.text)
        
        // Match exact text
        const exactPage = pages.find((p: any) => cleanStr(p.text).includes(targetClean))
        if (exactPage) {
          pageNumber = exactPage.num
        } else {
          // Fallback: Match on start substring
          const shortTarget = cleanStr(clause.text.slice(0, 40))
          const fallbackPage = pages.find((p: any) => cleanStr(p.text).includes(shortTarget))
          if (fallbackPage) {
            pageNumber = fallbackPage.num
          }
        }
      }
      return {
        ...clause,
        pageNumber,
      }
    })

    // 5. Create the Analysis in PostgreSQL
    const analysis = await Analysis.create({
      contractId,
      userId,
      overallScore: result.overallScore,
      summary: result.summary,
      keyDates: result.keyDates ?? [],
      obligations: result.obligations ?? [],
      clauses: enrichedClauses,
    })

    console.log(`[Worker] Analysis saved successfully. ID: ${analysis.id}`)

    // 6. Auto-sync extracted key dates to the scheduler service
    if (result.keyDates && result.keyDates.length > 0) {
      console.log(`[Worker] Syncing ${result.keyDates.length} key dates to scheduler...`)
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
        } catch (syncErr: any) {
          console.error('[Worker] Failed to sync key date to calendar:', syncErr.message)
        }
      }
    }

    // 7. Notify contract-service to update status to analyzed
    const patchRes = await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/status`, {
      method: 'PATCH',
      headers: { 
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'analyzed' }),
    })
    
    if (!patchRes.ok) {
      console.error(`[Worker] Failed to update contract status: ${patchRes.statusText}`)
    } else {
      console.log(`[Worker] Contract status updated to analyzed.`)
    }

  } catch (err: any) {
    console.error(`[Worker] Job failed for contract ${contractId}:`, err.message)
    // Notify contract-service that the analysis failed
    await fetch(`${CONTRACT_SERVICE}/contracts/${contractId}/status`, {
      method: 'PATCH',
      headers: { 
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'failed' }),
    }).catch((e: any) => console.error(`[Worker] Failed to mark contract status failed:`, e.message))
    throw err
  }
})
