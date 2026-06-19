import api from './api'

export const getCharities = (params = {}) => api.get('/api/charities', { params })
export const selectCharity = (charity_id, charity_percentage) =>
  api.post('/api/charities/select', { charity_id, charity_percentage })
export const createDonationCheckout = (charity_id, amount) =>
  api.post(`/api/charities/${charity_id}/donate`, { amount })
