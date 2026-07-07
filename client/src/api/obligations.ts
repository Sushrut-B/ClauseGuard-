import api from "./client"

export type ObligationStatus = 'pending' | 'in_progress' | 'fulfilled' | 'overdue'
export type ObligationCategory = 'payment' | 'delivery' | 'reporting' | 'confidentiality' | 'compliance' | 'other'
export type ObligationParty = 'company' | 'contractor' | 'both'

export interface Obligation {
  id: string
  party: ObligationParty
  action: string
  deadline: string | null
  category: ObligationCategory
  status: ObligationStatus
}

export const updateObligationStatus = async (
  contractId: string,
  obligationId: string,
  status: ObligationStatus
): Promise<Obligation[]> => {
  const { data } = await api.patch(`/ai/obligations/${contractId}`, { obligationId, status })
  return data.data
}