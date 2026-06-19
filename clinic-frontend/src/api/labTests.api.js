import api from './axios'

export const getPendingLabTests = async () => {
  const response = await api.get('/lab-tests/pending')
  return response.data.data || response.data
}

export const updateLabTestResults = async ({ id, status, results }) => {
  const response = await api.patch(`/lab-tests/${id}/results`, { status, results })
  return response.data
}

export const getCompletedLabTests = async () => {
  const response = await api.get('/lab-tests/completed')
  return response.data.data || response.data
}
