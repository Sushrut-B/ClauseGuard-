import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

import { fetchWithRetry } from '../services/geminiService'

// Simple fetch helper for Gemini API
const fetchGemini = async (prompt: string): Promise<string> => {
  const apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
  const response = await fetchWithRetry(`${apiUrl}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.0, responseMimeType: 'application/json' },
    }),
  })
  
  const data = (await response.json()) as any
  if (!response.ok) {
    throw new Error(`Gemini error: ${JSON.stringify(data)}`)
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('No response from Gemini')
  return text.replace(/```json|```/g, '').trim()
}

interface LabeledClause {
  text: string
  category: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface Prediction {
  index: number
  predicted: 'low' | 'medium' | 'high'
}

const runEvaluation = async () => {
  console.log('🧪 Starting Risk Scoring Evaluation Harness...')
  const filePath = path.join(__dirname, 'labeled_clauses.json')
  
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Dataset file not found at ${filePath}`)
    process.exit(1)
  }

  const dataset: LabeledClause[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  console.log(`📊 Loaded ${dataset.length} labeled contract clauses.`)

  // Prepare batch items (omitting the ground truth labels to prevent cheating)
  const batchItems = dataset.map((item, idx) => ({
    index: idx,
    text: item.text,
  }))

  const prompt = `
You are a legal contract auditor. Classify the risk level (low, medium, or high) of the following contract clauses.
Return a JSON array of objects. Do not include markdown wraps or explanations, just raw JSON.
Each object in the array must contain:
- index: the integer index of the clause in the list
- predicted: one of "low" | "medium" | "high"

Clauses List:
${JSON.stringify(batchItems, null, 2)}
`

  console.log('📡 Calling Gemini API to batch-classify clauses...')
  try {
    const rawResult = await fetchGemini(prompt)
    const predictions: Prediction[] = JSON.parse(rawResult)

    // Calculate metrics
    const classes = ['low', 'medium', 'high'] as const
    type ClassType = typeof classes[number]

    const confusionMatrix: Record<ClassType, Record<ClassType, number>> = {
      low: { low: 0, medium: 0, high: 0 },
      medium: { low: 0, medium: 0, high: 0 },
      high: { low: 0, medium: 0, high: 0 },
    }

    let correctCount = 0
    
    predictions.forEach((pred) => {
      const gt = dataset[pred.index].riskLevel
      const pr = pred.predicted.toLowerCase() as ClassType
      if (confusionMatrix[gt] && confusionMatrix[gt][pr] !== undefined) {
        confusionMatrix[gt][pr]++
      }
      if (gt === pr) {
        correctCount++
      }
    })

    console.log('\n📈 Calculating Metrics...')
    
    const accuracy = correctCount / dataset.length
    
    const classMetrics: Record<ClassType, { precision: number; recall: number; f1: number }> = {
      low: { precision: 0, recall: 0, f1: 0 },
      medium: { precision: 0, recall: 0, f1: 0 },
      high: { precision: 0, recall: 0, f1: 0 },
    }

    classes.forEach((c) => {
      // True Positive: GT is c, Pred is c
      const tp = confusionMatrix[c][c]
      
      // False Positive: GT is not c, Pred is c
      let fp = 0
      classes.forEach((otherGt) => {
        if (otherGt !== c) {
          fp += confusionMatrix[otherGt][c]
        }
      })

      // False Negative: GT is c, Pred is not c
      let fn = 0
      classes.forEach((otherPr) => {
        if (otherPr !== c) {
          fn += confusionMatrix[c][otherPr]
        }
      })

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

      classMetrics[c] = { precision, recall, f1 }
    })

    // Output Markdown Table format
    let mdTable = '\n### 📊 Risk Scoring Evaluation Benchmark Results\n\n'
    mdTable += '| Risk Tier | Precision | Recall | F1-Score | Total Samples |\n'
    mdTable += '| :--- | :---: | :---: | :---: | :---: |\n'

    classes.forEach((c) => {
      const samples = dataset.filter(item => item.riskLevel === c).length
      const m = classMetrics[c]
      mdTable += `| **${c.toUpperCase()}** | ${(m.precision * 100).toFixed(1)}% | ${(m.recall * 100).toFixed(1)}% | ${(m.f1 * 100).toFixed(1)}% | ${samples} |\n`
    })
    
    mdTable += `| **Overall Accuracy** | - | - | **${(accuracy * 100).toFixed(1)}%** | **${dataset.length}** |\n`

    console.log(mdTable)
    
    // Save results to file
    const outputPath = path.join(__dirname, 'evaluation_results.md')
    fs.writeFileSync(outputPath, mdTable)
    console.log(`✅ Benchmark results saved to ${outputPath}`)

  } catch (err: any) {
    console.error('❌ Evaluation failed:', err.message)
  }
}

runEvaluation()
