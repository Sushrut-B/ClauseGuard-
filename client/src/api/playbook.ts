import api from './client'

export interface PlaybookRule {
  id: string
  text: string
  category: 'general' | 'payment' | 'liability' | 'termination' | 'ip' | 'dispute'
  createdAt: string
}

export const getPlaybookRules = async () => {
  const { data } = await api.get('/ai/playbook')
  return data.data as PlaybookRule[]
}

export const createPlaybookRule = async (text: string, category: string) => {
  const { data } = await api.post('/ai/playbook', { text, category })
  return data.data as PlaybookRule
}

export const deletePlaybookRule = async (id: string) => {
  await api.delete(`/ai/playbook/${id}`)
}
