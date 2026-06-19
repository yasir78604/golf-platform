import api from './api'

export const createCheckout = (plan) => api.post('/api/subscriptions/checkout', { plan })
export const getSubscription = () => api.get('/api/subscriptions')
export const cancelSubscription = () => api.post('/api/subscriptions/cancel')
