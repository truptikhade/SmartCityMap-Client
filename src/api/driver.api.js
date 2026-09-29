import api from '../lib/axios'

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

export const getDriverDashboardAPI =
  async () => {
    const response =
      await api.get(
        '/api/driver/dashboard'
      )

    return response.data
  }

// --------------------------------------------------
// PENDING RIDES
// --------------------------------------------------

export const getDriverPendingRidesAPI =
  async () => {
    const response =
      await api.get(
        '/api/driver/rides/pending'
      )

    return response.data
  }

// --------------------------------------------------
// PROFILE
// --------------------------------------------------

export const getDriverProfileAPI =
  async () => {
    const response =
      await api.get(
        '/api/driver/profile'
      )

    return response.data
  }

export const updateDriverProfileAPI =
  async (data) => {
    const response =
      await api.put(
        '/api/driver/profile',
        data
      )

    return response.data
  }

// --------------------------------------------------
// VEHICLES
// --------------------------------------------------

export const getDriverVehiclesAPI =
  async () => {
    const response =
      await api.get(
        '/api/driver/vehicles'
      )

    return response.data
  }

// Get vehicle change request history

export const getVehicleChangeRequestsAPI =
  async () => {
    const response =
      await api.get(
        '/api/driver/vehicle-change-requests'
      )

    return response.data
  }

// Request vehicle change

export const requestVehicleChangeAPI =
  async (data) => {
    const response =
      await api.post(
        '/api/driver/vehicles',
        data
      )

    return response.data
  }

// --------------------------------------------------
// AVAILABILITY
// --------------------------------------------------

export const updateDriverAvailabilityAPI =
  async (isAvailable) => {
    const response =
      await api.put(
        '/api/driver/availability',
        {
          isAvailable,
        }
      )

    return response.data
  }

// --------------------------------------------------
// ACCEPT RIDE
// --------------------------------------------------

export const acceptRideAPI =
  async (
    rideId,
    vehicleId
  ) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/accept`,
        {
          vehicleId,
        }
      )

    return response.data
  }

// --------------------------------------------------
// DRIVER ARRIVING
// --------------------------------------------------

export const driverArrivingAPI =
  async (rideId) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/arriving`
      )

    return response.data
  }

// --------------------------------------------------
// DRIVER ARRIVED
// --------------------------------------------------

export const driverArrivedAPI =
  async (rideId) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/arrived`
      )

    return response.data
  }

// --------------------------------------------------
// VERIFY OTP
// --------------------------------------------------

export const verifyRideOtpAPI =
  async (
    rideId,
    otp
  ) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/verify-otp`,
        {
          otp,
        }
      )

    return response.data
  }

// --------------------------------------------------
// START RIDE
// --------------------------------------------------

export const startRideAPI =
  async (rideId) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/start`
      )

    return response.data
  }

// --------------------------------------------------
// COMPLETE RIDE
// --------------------------------------------------

export const completeRideAPI =
  async (
    rideId,
    finalFare
  ) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/complete`,
        {
          finalFare,
        }
      )

    return response.data
  }

// --------------------------------------------------
// CANCEL RIDE
// --------------------------------------------------

export const cancelRideAPI =
  async (rideId) => {
    const response =
      await api.put(
        `/api/rides/${rideId}/cancel`
      )

    return response.data
  }