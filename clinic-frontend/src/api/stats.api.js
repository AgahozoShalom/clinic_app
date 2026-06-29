import api from './axios'

export const getDashboardStats = async () => {
  const response = await api.get('/stats')
  return response.data
}
