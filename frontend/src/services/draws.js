import api from './api'

export const getDraws = () => api.get('/api/draws')
export const getDrawById = (id) => api.get(`/api/draws/${id}`)
export const getMyResults = () => api.get('/api/draws/my-results')
