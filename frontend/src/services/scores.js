import api from './api'

export const getScores = () => api.get('/api/scores')
export const addScore = (score, date) => api.post('/api/scores', { score, date })
export const updateScore = (id, score, date) => api.patch(`/api/scores/${id}`, { score, date })
export const deleteScore = (id) => api.delete(`/api/scores/${id}`)
