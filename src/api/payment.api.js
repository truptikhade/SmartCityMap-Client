import api from '../lib/axios'

export const initiatePaymentAPI = (data)      => api.post('/api/payment/initiate', data)
export const verifyPaymentAPI   = (data)      => api.post('/api/payment/verify', data)
export const getPaymentAPI      = (bookingId) => api.get(`/api/payment/${bookingId}`)