import api from "./client"

export interface ComparisonChange {
  category: string
  type: "added" | "removed" | "modified"
  severity: "high" | "medium" | "low"
  description: string
  textA: string | null
  textB: string | null
}

export interface ComparisonResult {
  nameA: string
  nameB: string
  summary: string
  riskScoreA: number
  riskScoreB: number
  verdict: "improved" | "worsened" | "neutral"
  changes: ComparisonChange[]
}

export const compareContracts = async (
  contractIdA: string,
  contractIdB: string
): Promise<ComparisonResult> => {
  const { data } = await api.post("/ai/compare", { contractIdA, contractIdB })
  return data.data
}