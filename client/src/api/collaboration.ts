import api from "./client"

export type ShareRole = "viewer" | "reviewer" | "approver"

export interface ContractShare {
  id: string
  contractId: string
  email: string
  name: string
  role: ShareRole
  status: "pending" | "accepted"
  token: string
  createdAt: string
}

export interface ContractComment {
  id: string
  contractId: string
  authorEmail: string
  authorName: string
  type: "general" | "clause"
  clauseIndex: number | null
  text: string
  decision: "approved" | "changes_requested" | null
  createdAt: string
}

export const getShares = async (contractId: string): Promise<ContractShare[]> => {
  const { data } = await api.get(`/contracts/${contractId}/shares`)
  return data.data
}

export const shareContract = async (
  contractId: string,
  email: string,
  name: string,
  role: ShareRole
): Promise<ContractShare> => {
  const { data } = await api.post(`/contracts/${contractId}/share`, { email, name, role })
  return data.data
}

export const removeShare = async (contractId: string, shareId: string): Promise<void> => {
  await api.delete(`/contracts/${contractId}/shares/${shareId}`)
}

export const getComments = async (contractId: string): Promise<ContractComment[]> => {
  const { data } = await api.get(`/contracts/${contractId}/comments`)
  return data.data
}

export const postComment = async (
  contractId: string,
  text: string,
  type: "general" | "clause",
  clauseIndex?: number,
  decision?: "approved" | "changes_requested"
): Promise<ContractComment> => {
  const { data } = await api.post(`/contracts/${contractId}/comments`, {
    text, type, clauseIndex, decision,
  })
  return data.data
}

export const deleteComment = async (contractId: string, commentId: string): Promise<void> => {
  await api.delete(`/contracts/${contractId}/comments/${commentId}`)
}