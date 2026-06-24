import api from './axios'

export const getCases = async (params) => {
  const response = await api.get('/cases', { params })
  return response.data.data || response.data
}

export const getCaseById = async (id) => {
  const response = await api.get(`/cases/${id}`)
  return response.data
}

export const createCase = async (data) => {
  const response = await api.post('/cases', data)
  return response.data
}

export const closeCase = async (id) => {
  const response = await api.patch(`/cases/${id}/close`)
  return response.data
}

export const addFindings = async ({ id, ...data }) => {
  const response = await api.post(`/cases/${id}/findings`, data)
  return response.data
}

export const addLabTest = async ({ id, ...data }) => {
  const response = await api.post(`/cases/${id}/lab-tests`, data)
  return response.data
}

export const addMedication = async ({ id, ...data }) => {
  const response = await api.post(`/cases/${id}/medications`, data)
  return response.data
}

export const transferCase = async ({ id, ...data }) => {
  const response = await api.post(`/cases/${id}/transfer`, data)
  return response.data
}

export const escalateCase = async ({ id, ...data }) => {
  const response = await api.post(`/cases/${id}/escalate`, data)
  return response.data
}

export const toggleFollowUp = async (id) => {
  const response = await api.patch(`/cases/${id}/follow-up`)
  return response.data
}
