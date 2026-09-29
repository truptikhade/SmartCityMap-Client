import api from '../lib/axios'

export const registerAPI = (data) =>
  api.post('/api/auth/register', data)

export const registerDriverAPI = (data) =>
  api.post('/api/auth/register/driver', data)

export const loginAPI = (data) =>
  api.post('/api/auth/login', data)

export const getProfileAPI = () =>
  api.get('/api/auth/profile')

export const updateProfileAPI = (data) =>
  api.put('/api/auth/profile', data)

export const changePasswordAPI = (data) =>
  api.put('/api/auth/change-password', data)

export const forgotPasswordAPI = (data) =>
  api.post('/api/auth/forgot-password', data)

export const resetPasswordAPI = (data) =>
  api.post('/api/auth/reset-password', data)

// ─────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────

export const verifyEmailAPI = (token) =>
  api.get('/api/auth/verify-email', {
    params: {
      token,
    },
  })

export const sendVerificationAPI = () =>
  api.post('/api/auth/send-verification')
