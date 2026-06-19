import api from './api'

export const getDraws = () => api.get('/api/draws')
export const getDrawById = (id) => api.get(`/api/draws/${id}`)
export const getMyResults = () => api.get('/api/draws/my-results')
export const submitWinnerProof = (id, file) => {
  const formData = new FormData()
  formData.append('proof', file)
  return api.post(`/api/draws/results/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
