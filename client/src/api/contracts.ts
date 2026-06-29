import api from './client'

export const getContracts = async () => {
  const { data } = await api.get('/contracts')
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
