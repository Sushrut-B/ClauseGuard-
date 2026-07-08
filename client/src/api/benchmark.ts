import api from "./client"

export interface CategoryBenchmark {
  category: string
  currentScore: number
  avgScore: number
}

export interface BenchmarkResult {
  currentScore: number
  avgScore: number
  percentile: number
  totalContracts: number
  categoryBenchmark: CategoryBenchmark[]
}

export const getBenchmark = async (contractId: string): Promise<BenchmarkResult> => {
  const { data } = await api.get(`/ai/benchmark/${contractId}`)
  return data.data
}