import api from './api'

export const getAnalytics = () => api.get('/api/admin/analytics')
export const getUsers = () => api.get('/api/admin/users')
export const updateUser = (id, updates) => api.patch(`/api/admin/users/${id}`, updates)
export const createDraw = (month, year, draw_type) =>
  api.post('/api/admin/draws', { month, year, draw_type })
export const executeDraw = (id, draw_type) =>
  api.post(`/api/admin/draws/${id}/execute`, { draw_type })
export const publishDraw = (id) => api.post(`/api/admin/draws/${id}/publish`)
export const getWinners = () => api.get('/api/admin/winners')
export const verifyWinner = (id, status) => api.patch(`/api/admin/winners/${id}`, { status })
export const createCharity = (data) => api.post('/api/admin/charities?action=create', data)
export const updateCharity = (id, data) => api.patch(`/api/admin/charities/${id}?action=update`, data)
export const deleteCharity = (id) => api.delete(`/api/admin/charities/${id}?action=delete`)
