import api from "./client"

export type AuditAction =
  | 'contract.viewed'
  | 'contract.uploaded'
  | 'contract.analyzed'
  | 'contract.deleted'
  | 'contract.stage_changed'
  | 'contract.shared'
  | 'contract.signed'
  | 'obligation.updated'
  | 'comment.added'

export interface AuditLogEntry {
  id: string
  contractId: string
  userId: string
  userEmail: string
  action: AuditAction
  metadata: Record<string, any>
  createdAt: string
}

export const getAuditLog = async (contractId: string): Promise<AuditLogEntry[]> => {
  const { data } = await api.get(`/audit/${contractId}`)
  return data.data
}