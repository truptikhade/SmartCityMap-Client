import api from '../lib/axios'

export const getRoutesAPI = (params) =>
  api.get('/api/transit/routes', {
    params,
  })

export const getRouteByIdAPI = (id) =>
  api.get(
    `/api/transit/routes/${id}`
  )

export const getStopsAPI = (id) =>
  api.get(
    `/api/transit/routes/${id}/stops`
  )

export const getTripsAPI = (
  id,
  date
) =>
  api.get(
    `/api/transit/routes/${id}/trips`,
    {
      params: {
        date,
      },
    }
  )

/*
 * One specific bus/train live location
 */
export const getLiveAPI = (
  tripId
) =>
  api.get(
    `/api/transit/live/${tripId}`
  )

/*
 * All live buses/trains on one route
 */
export const getRouteLiveVehiclesAPI = (
  routeId,
  date
) =>
  api.get(
    `/api/transit/routes/${routeId}/live`,
    {
      params: {
        date,
      },
    }
  )

export const getNearbyStopsAPI = (
  params
) =>
  api.get(
    '/api/transit/stops/nearby',
    {
      params,
    }
  )

export const searchJourneyAPI = (
  params
) =>
  api.get(
    '/api/transit/journey/search',
    {
      params,
    }
  )
