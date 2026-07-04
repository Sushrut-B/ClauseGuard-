import api from "./client"

export interface ContractInsight {
  contractId: string
  originalName: string
  createdAt: string
  overallScore: number
  summary: string
  clauses: Array<{
    category: string
    severity: "high" | "medium" | "low"
    score: number
  }>
}

export const getAllInsights = async (): Promise<ContractInsight[]> => {
  const { data } = await api.get("/contracts")
  const contracts = data.data as Array<{ id: string; originalName: string; createdAt: string; status: string }>
  const analyzed = contracts.filter((c) => c.status === "analyzed")
  const analyses = await Promise.allSettled(
    analyzed.map((c) =>
      api.get(`/ai/analysis/${c.id}`).then((r) => ({
        contractId: c.id,
        originalName: c.originalName,
        createdAt: c.createdAt,
        overallScore: r.data.data.overallScore,
        summary: r.data.data.summary,
        clauses: (r.data.data.clauses ?? []).map((cl: any) => ({
          category: cl.category,
          severity: cl.severity ?? (cl.score >= 70 ? "high" : cl.score >= 40 ? "medium" : "low"),
          score: cl.score ?? 0,
        })),
      }))
    )
  )
  return analyses
    .filter((r): r is PromiseFulfilledResult<ContractInsight> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}