import api from './client'

export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data.data // { user, accessToken, refreshToken }
}

export const register = async (email: string, password: string, name: string) => {
  const { data } = await api.post('/auth/register', { email, password, name })
  return data.data
}

export const getMe = async () => {
  const { data } = await api.get('/auth/me')
  return data.data
}