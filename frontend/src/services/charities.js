import api from './api'

export const getCharities = () => api.get('/api/charities')
export const selectCharity = (charity_id, charity_percentage) =>
  api.post('/api/charities/select', { charity_id, charity_percentage })
