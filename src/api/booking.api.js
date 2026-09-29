import api from '../lib/axios'

export const createBookingAPI  = (data) => api.post('/api/booking', data)
export const getMyBookingsAPI  = ()     => api.get('/api/booking/my')
export const getBookingByIdAPI = (id)   => api.get(`/api/booking/${id}`)
export const cancelBookingAPI  = (id)   => api.put(`/api/booking/${id}/cancel`)