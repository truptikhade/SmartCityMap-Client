import api from '../lib/axios'

export const createRideAPI = async (data) => {
  const response = await api.post(
    '/api/rides',
    data
  )

  return response.data
}

export const getRideAPI = async (rideId) => {
  const response = await api.get(
    `/api/rides/${rideId}`
  )

  return response.data
}

export const getPassengerRidesAPI = async () => {
  const response = await api.get(
    '/api/rides/passenger'
  )

  return response.data
}

export const getAvailableDriversAPI = async (
  vehicleType
) => {
  const response = await api.get(
    '/api/rides/available-drivers',
    {
      params: {
        vehicleType,
      },
    }
  )

  return response.data
}

export const getMatchingDriversAPI = async (
  data
) => {
  const response = await api.get(
    '/api/rides/matching-drivers',
    {
      params: data,
    }
  )

  return response.data
}

export const cancelRideAPI = async (
  rideId
) => {
  const response = await api.put(
    `/api/rides/${rideId}/cancel`
  )

  return response.data
}