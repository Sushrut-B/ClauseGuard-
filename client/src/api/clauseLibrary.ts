import api from "./client"

export type ClauseCategory = 'liability' | 'termination' | 'payment' | 'ip' | 'dispute'
export type RiskLevel = 'safe' | 'balanced' | 'caution'

export interface ClauseTemplate {
  id: string
  category: ClauseCategory
  title: string
  description: string
  text: string
  riskLevel: RiskLevel
  tags: string[]
}

export const getClauseTemplates = async (params?: {
  category?: ClauseCategory
  riskLevel?: RiskLevel
  search?: string
}): Promise<ClauseTemplate[]> => {
  const query = new URLSearchParams()
  if (params?.category) query.set('category', params.category)
  if (params?.riskLevel) query.set('riskLevel', params.riskLevel)
  if (params?.search) query.set('search', params.search)
  const { data } = await api.get(`/clause-templates?${query.toString()}`)
  return data.data
}