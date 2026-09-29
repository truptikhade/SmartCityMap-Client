import api from '../lib/axios'

// --------------------------------------------------
// DRIVERS
// --------------------------------------------------

export const getAllDriversAPI =
  async () => {
    const response =
      await api.get(
        '/api/admin/drivers'
      )

    return response.data
  }

export const getDriverByIdAPI =
  async (driverId) => {
    const response =
      await api.get(
        `/api/admin/drivers/${driverId}`
      )

    return response.data
  }

export const approveDriverAPI =
  async (driverId) => {
    const response =
      await api.put(
        `/api/admin/drivers/${driverId}/approve`
      )

    return response.data
  }

export const rejectDriverAPI =
  async (driverId) => {
    const response =
      await api.put(
        `/api/admin/drivers/${driverId}/reject`
      )

    return response.data
  }

// --------------------------------------------------
// VEHICLE CHANGE REQUESTS
// --------------------------------------------------

export const getPendingVehicleChangeRequestsAPI =
  async () => {
    const response =
      await api.get(
        '/api/admin/vehicle-change-requests'
      )

    return response.data
  }

export const approveVehicleChangeRequestAPI =
  async (requestId) => {
    const response =
      await api.put(
        `/api/admin/vehicle-change-requests/${requestId}/approve`
      )

    return response.data
  }

export const rejectVehicleChangeRequestAPI =
  async (requestId) => {
    const response =
      await api.put(
        `/api/admin/vehicle-change-requests/${requestId}/reject`
      )

    return response.data
  }