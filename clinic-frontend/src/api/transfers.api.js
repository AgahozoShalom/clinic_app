import api from './axios'

export const getPendingTransfers = async () => {
  const response = await api.get('/transfers/pending')
  return response.data
}

export const updateTransferStatus = async ({ id, status }) => {
  const response = await api.patch(`/transfers/${id}/status`, { status })
  return response.data
}
