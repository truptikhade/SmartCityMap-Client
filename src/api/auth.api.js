import api from '../lib/axios'

export const registerAPI      = (data) => api.post('/api/auth/register', data)
export const loginAPI         = (data) => api.post('/api/auth/login', data)
export const getProfileAPI    = ()     => api.get('/api/auth/profile')
export const updateProfileAPI = (data) => api.put('/api/auth/profile', data)