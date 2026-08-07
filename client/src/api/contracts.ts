import api from './client'
export type LifecycleStage = 'draft' | 'review' | 'approved' | 'signed' | 'active' | 'expiring' | 'expired'
export const getContracts = async () => {
  const { data } = await api.get('/contracts')
  return data.data
}
export const getContractMeta = async (id: string) => {
  const { data } = await api.get(`/contracts/${id}`)
  return data.data
}
export const getContract = async (id: string) => {
  const { data } = await api.get(`/contracts/${id}/text`)
  return data.data
}
export const uploadContract = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/contracts/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}
export const deleteContract = async (id: string) => {
  await api.delete(`/contracts/${id}`)
}
export const analyzeContract = async (id: string) => {
  const { data } = await api.post(`/ai/analyze/${id}`)
  return data.data
}
export const reanalyzeContract = async (id: string) => {
  const { data } = await api.post(`/ai/reanalyze/${id}`)
  return data.data
}
export const getAnalysis = async (contractId: string) => {
  const { data } = await api.get(`/ai/analysis/${contractId}`)
  return data.data
}
export const rewriteClause = async (
  clauseText: string,
  category: string,
  reason: string
) => {
  const { data } = await api.post('/ai/rewrite', { clauseText, category, reason })
  return data.data.rewritten as string
}
export const crossCheckContracts = async (contract1Id: string, contract2Id: string) => {
  const { data } = await api.post('/ai/cross-check', { contract1Id, contract2Id })
  return data.data
}
export const updateLifecycleStage = async (id: string, stage: LifecycleStage) => {
  const { data } = await api.patch(`/contracts/${id}/stage`, { stage })
  return data.data
}
export const sendForSignature = async (id: string, signerEmail: string, signerName: string) => {
  const { data } = await api.post(`/contracts/${id}/send`, { signerEmail, signerName })
  return data.data
}
export const getSignatureStatus = async (id: string) => {
  const { data } = await api.get(`/contracts/${id}/signature-status`)
  return data.data
}
export const submitFeedback = async (payload: {
  contractId: string
  clauseText: string
  category: string
  originalSeverity?: string
  correctedSeverity?: string
  originalSuggestion?: string
  correctedSuggestion?: string
}) => {
  const { data } = await api.post('/ai/feedback', payload)
  return data.data
}

export const generateStitchUI = async (prompt: string) => {
  const { data } = await api.post('/ai/stitch/generate', { prompt })
  return data.data
}