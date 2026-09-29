'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin, RefreshCw, Route } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  getDriverDashboardAPI,
  updateDriverAvailabilityAPI,
} from '../../api/driver.api'

import {
  connectDriverSocket,
  disconnectDriverSocket,
} from '../../lib/rideSocket'

import DriverHeader from './DriverHeader'
import DriverStats from './DriverStats'
import DriverAvailability from './DriverAvailability'
import RideRequestCard from './RideRequestCard'
import ActiveRideCard from './ActiveRideCard'
import DriverRideHistory from './DriverRideHistory'

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [pendingRides, setPendingRides] = useState([])
  const [activeRide, setActiveRide] = useState(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingAvailability, setIsUpdatingAvailability] =
    useState(false)

  const [isAvailable, setIsAvailable] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  // --------------------------------------------------
  // Load dashboard
  // --------------------------------------------------

  const loadDashboard = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setIsRefreshing(true)
        } else {
          setIsLoading(true)
        }

        const response = await getDriverDashboardAPI()

        const data = response?.data || response

        setDashboard(data)

        const available =
          data?.availability?.isAvailable ??
          data?.driver?.isAvailable ??
          false

        setIsAvailable(Boolean(available))

        setPendingRides(
          data?.pendingRequests ||
            data?.pendingRides ||
            []
        )

        setActiveRide(
          data?.activeRide || null
        )
      } catch (error) {
        console.error(
          'Driver dashboard error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load driver dashboard'
        )
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    []
  )

  // --------------------------------------------------
  // Initial dashboard load
  // --------------------------------------------------

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // --------------------------------------------------
  // Driver vehicle
  // --------------------------------------------------

  const driverVehicle =
    dashboard?.driver?.vehicles?.find(
      (vehicle) => vehicle.isActive
    ) ||
    dashboard?.driver?.vehicles?.[0] ||
    null

  // --------------------------------------------------
  // Socket connection
  // --------------------------------------------------

  useEffect(() => {
    if (!dashboard?.driver?.userId) {
      return
    }

    if (!isAvailable) {
      disconnectDriverSocket()
      setSocketConnected(false)

      return
    }

    if (!driverVehicle?.vehicleType) {
      console.warn(
        'Driver socket: no vehicle type available'
      )

      return
    }

    const driverId =
      dashboard.driver.userId

    const socket = connectDriverSocket({
      driverId,
      vehicleType:
        driverVehicle.vehicleType,
    })

    const handleConnect = () => {
      setSocketConnected(true)
    }

    const handleDisconnect = () => {
      setSocketConnected(false)
    }

    const handleConnectError = (error) => {
      console.error(
        'Driver socket connection error:',
        error
      )

      setSocketConnected(false)
    }

    // --------------------------------------------------
    // New ride request
    // --------------------------------------------------

    const handleNewRide = (payload) => {
      const newRide = payload?.ride

      if (!newRide?.id) {
        return
      }

      // Make sure the request matches driver's vehicle
      if (
        newRide.vehicleType &&
        newRide.vehicleType !==
          driverVehicle.vehicleType
      ) {
        return
      }

      setPendingRides((currentRides) => {
        const alreadyExists =
          currentRides.some(
            (ride) =>
              ride.id === newRide.id
          )

        if (alreadyExists) {
          return currentRides
        }

        return [
          newRide,
          ...currentRides,
        ]
      })

      toast.success(
        'New ride request received'
      )
    }

    // --------------------------------------------------
    // Ride status update
    // --------------------------------------------------

    const handleRideUpdated = (payload) => {
      const updatedRide =
        payload?.ride

      if (!updatedRide?.id) {
        return
      }

      // ----------------------------------------------
      // If this ride is already active
      // ----------------------------------------------

      if (
        activeRide?.id ===
        updatedRide.id
      ) {
        if (
          updatedRide.status ===
            'COMPLETED' ||
          updatedRide.status ===
            'CANCELLED'
        ) {
          setActiveRide(null)

          setPendingRides(
            (currentRides) =>
              currentRides.filter(
                (ride) =>
                  ride.id !==
                  updatedRide.id
              )
          )

          loadDashboard(true)

          return
        }

        setActiveRide(
          updatedRide
        )

        return
      }

      // ----------------------------------------------
      // If driver accepted this ride
      // ----------------------------------------------

      if (
        updatedRide.driver?.id ===
          dashboard.driver.userId &&
        [
          'ACCEPTED',
          'DRIVER_ARRIVING',
          'DRIVER_ARRIVED',
          'OTP_VERIFIED',
          'IN_PROGRESS',
        ].includes(
          updatedRide.status
        )
      ) {
        setActiveRide(
          updatedRide
        )

        setPendingRides(
          (currentRides) =>
            currentRides.filter(
              (ride) =>
                ride.id !==
                updatedRide.id
            )
        )

        return
      }

      // ----------------------------------------------
      // Ride cancelled before acceptance
      // ----------------------------------------------

      if (
        updatedRide.status ===
          'CANCELLED' &&
        pendingRides.some(
          (ride) =>
            ride.id ===
            updatedRide.id
        )
      ) {
        setPendingRides(
          (currentRides) =>
            currentRides.filter(
              (ride) =>
                ride.id !==
                updatedRide.id
            )
        )
      }
    }

    socket.on(
      'connect',
      handleConnect
    )

    socket.on(
      'disconnect',
      handleDisconnect
    )

    socket.on(
      'connect_error',
      handleConnectError
    )

    socket.on(
      'ride:new_request',
      handleNewRide
    )

    socket.on(
      'ride:updated',
      handleRideUpdated
    )

    if (socket.connected) {
      setSocketConnected(true)
    }

    return () => {
      socket.off(
        'connect',
        handleConnect
      )

      socket.off(
        'disconnect',
        handleDisconnect
      )

      socket.off(
        'connect_error',
        handleConnectError
      )

      socket.off(
        'ride:new_request',
        handleNewRide
      )

      socket.off(
        'ride:updated',
        handleRideUpdated
      )

      disconnectDriverSocket()

      setSocketConnected(false)
    }
  }, [
    dashboard,
    isAvailable,
    driverVehicle?.vehicleType,
    activeRide?.id,
    pendingRides,
    loadDashboard,
  ])

  // --------------------------------------------------
  // Availability
  // --------------------------------------------------

  const handleAvailabilityChange = async (
    nextValue
  ) => {
    if (!dashboard?.driver?.isApproved) {
      toast.error(
        'Your driver account is not approved yet'
      )

      return
    }

    try {
      setIsUpdatingAvailability(true)

      const response =
        await updateDriverAvailabilityAPI(
          nextValue
        )

      const data =
        response?.data || response

      const updatedAvailability =
        data?.isAvailable ??
        nextValue

      setIsAvailable(
        Boolean(
          updatedAvailability
        )
      )

      setDashboard(
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            availability: {
              ...(current.availability ||
                {}),
              isAvailable:
                Boolean(
                  updatedAvailability
                ),
            },
            driver: {
              ...(current.driver ||
                {}),
              isAvailable:
                Boolean(
                  updatedAvailability
                ),
            },
          }
        }
      )

      toast.success(
        nextValue
          ? 'You are now online'
          : 'You are now offline'
      )
    } catch (error) {
      console.error(
        'Availability update error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to update availability'
      )
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  // --------------------------------------------------
  // Ride accepted
  // --------------------------------------------------

  const handleRideAccepted = (
    ride
  ) => {
    if (!ride) {
      return
    }

    setActiveRide(ride)

    setPendingRides(
      (currentRides) =>
        currentRides.filter(
          (item) =>
            item.id !== ride.id
        )
    )

    toast.success(
      'Ride accepted successfully'
    )
  }

  // --------------------------------------------------
  // Active ride updated
  // --------------------------------------------------

  const handleActiveRideUpdate = (
    ride
  ) => {
    if (!ride) {
      return
    }

    if (
      ride.status === 'COMPLETED' ||
      ride.status === 'CANCELLED'
    ) {
      setActiveRide(null)

      loadDashboard(true)

      return
    }

    setActiveRide(ride)
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="flex items-center gap-3 text-gray-600">
            <RefreshCw
              className="h-5 w-5 animate-spin"
            />

            <span>
              Loading driver dashboard...
            </span>
          </div>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // No dashboard
  // --------------------------------------------------

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-gray-400" />

            <h2 className="text-lg font-semibold text-gray-900">
              Driver dashboard unavailable
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Please refresh and try again.
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard(true)
              }
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const driver =
    dashboard.driver || {}

  const stats =
    dashboard.summary || {}

  const recentRides =
    dashboard.recentRides || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ---------------------------------------- */}
        {/* Header */}
        {/* ---------------------------------------- */}

        <DriverHeader
          driver={driver}
          vehicle={driverVehicle}
          socketConnected={
            socketConnected
          }
          onRefresh={() =>
            loadDashboard(true)
          }
          isRefreshing={
            isRefreshing
          }
        />

        {/* ---------------------------------------- */}
        {/* Approval warning */}
        {/* ---------------------------------------- */}

        {!driver.isApproved && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-amber-600" />

              <div>
                <h3 className="font-semibold text-amber-900">
                  Account approval pending
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  Your driver account must be
                  approved before you can
                  receive ride requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------- */}
        {/* Availability */}
        {/* ---------------------------------------- */}

        <div className="mt-6">
          <DriverAvailability
            isAvailable={
              isAvailable
            }
            isApproved={
              Boolean(
                driver.isApproved
              )
            }
            isUpdating={
              isUpdatingAvailability
            }
            onChange={
              handleAvailabilityChange
            }
          />
        </div>

        {/* ---------------------------------------- */}
        {/* Stats */}
        {/* ---------------------------------------- */}

        <div className="mt-6">
          <DriverStats
            stats={stats}
          />
        </div>

        {/* ---------------------------------------- */}
        {/* Active ride */}
        {/* ---------------------------------------- */}

        {activeRide && (
          <section className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Route className="h-5 w-5 text-gray-700" />

              <h2 className="text-lg font-semibold text-gray-900">
                Active Ride
              </h2>
            </div>

            <ActiveRideCard
              ride={activeRide}
              onRideUpdated={
                handleActiveRideUpdate
              }
            />
          </section>
        )}

        {/* ---------------------------------------- */}
        {/* Pending requests */}
        {/* ---------------------------------------- */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ride Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Requests matching your vehicle
                type will appear here.
              </p>
            </div>

            {pendingRides.length > 0 && (
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                {pendingRides.length}
              </span>
            )}
          </div>

          {pendingRides.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-gray-400" />

              <h3 className="font-medium text-gray-900">
                No ride requests
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                New matching requests will appear
                automatically when you are online.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRides.map(
                (ride) => (
                  <RideRequestCard
                    key={ride.id}
                    ride={ride}
                    vehicle={
                      driverVehicle
                    }
                    onAccepted={
                      handleRideAccepted
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* ---------------------------------------- */}
        {/* Ride history */}
        {/* ---------------------------------------- */}

        <section className="mt-8 pb-10">
          <DriverRideHistory
            rides={recentRides}
          />
        </section>
      </div>
    </div>
  )
}