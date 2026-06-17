import api from './axios'

export const getStudents = async (params) => {
  const response = await api.get('/students', { params })
  console.log(response.data);
  return response.data.data || response.data
}

export const getStudentById = async (id) => {
  const response = await api.get(`/students/${id}`)
  console.log(response.data);
  return response.data
}

export const createStudent = async (data) => {
  const response = await api.post('/students', data)
  return response.data
}

export const updateStudent = async ({ id, ...data }) => {
  const response = await api.patch(`/students/${id}`, data)
  return response.data
}

export const getStudentMedicalHistory = async (id) => {
  const response = await api.get('/cases', { params: { student_id: id } })
  return response.data.data || response.data
}

export const uploadStudents = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/students/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`)
  return response.data
}

export const deleteAllStudents = async () => {
  const response = await api.delete('/students/all')
  return response.data
}
