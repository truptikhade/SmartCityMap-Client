import api from '../lib/axios'

export const getNearbyPlacesAPI = (params) =>
  api.get('/api/places/nearby', { params })

export const getAllPlacesAPI = (params) =>
  api.get('/api/places', { params })

export const getPlaceByIdAPI = (id) =>
  api.get(`/api/places/${id}`)

export const getReviewsAPI = (id) =>
  api.get(`/api/places/${id}/reviews`)

export const addReviewAPI = (id, data) =>
  api.post(`/api/places/${id}/reviews`, data)

export const getAIRecommendationsAPI = (params) =>
  api.get('/api/ai/recommendations', {
    params,
  })

export const getNearbyRecommendationsAPI = (
  params
) =>
  api.get('/api/ai/recommendations', {
    params,
  })
