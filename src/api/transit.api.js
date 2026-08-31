import api from '../lib/axios'

export const getRoutesAPI    = (params) => api.get('/api/transit/routes', { params })
export const getRouteByIdAPI = (id)     => api.get(`/api/transit/routes/${id}`)
export const getStopsAPI     = (id)     => api.get(`/api/transit/routes/${id}/stops`)
export const getTripsAPI     = (id, date) => api.get(`/api/transit/routes/${id}/trips`, { params: { date } })
export const getLiveAPI      = (tripId) => api.get(`/api/transit/live/${tripId}`)
export const getNearbyStopsAPI = (params) => api.get('/api/transit/stops/nearby', { params })