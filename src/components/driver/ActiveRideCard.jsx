'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  Play,
  ShieldCheck,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  driverArrivingAPI,
  driverArrivedAPI,
  verifyRideOtpAPI,
  startRideAPI,
  completeRideAPI,
  cancelRideAPI,
} from '../../api/driver.api'

import DriverOtpModal from './DriverOtpModal'

export default function ActiveRideCard({
  ride,
  onRideUpdated,
}) {
  const [isLoading, setIsLoading] =
    useState(false)

  const [otpModalOpen, setOtpModalOpen] =
    useState(false)

  const [otp, setOtp] =
    useState('')

  const [finalFare, setFinalFare] =
    useState('')

  const [currentRide, setCurrentRide] =
    useState(ride)

  // --------------------------------------------------
  // Sync ride with parent / Socket.IO updates
  // --------------------------------------------------

  useEffect(() => {
    setCurrentRide(ride)
  }, [ride])

  if (!currentRide) {
    return null
  }

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getResponseData = (response) => {
    return response?.data || response
  }

  const updateRide = (updatedRide) => {
    if (!updatedRide) {
      return
    }

    setCurrentRide(updatedRide)

    if (onRideUpdated) {
      onRideUpdated(updatedRide)
    }
  }

  const getPassengerName = () => {
    if (!currentRide.passenger) {
      return 'Passenger'
    }

    return (
      `${currentRide.passenger.fname || ''} ${
        currentRide.passenger.lname || ''
      }`.trim() || 'Passenger'
    )
  }

  // --------------------------------------------------
  // Driver arriving
  // --------------------------------------------------

  const handleDriverArriving = async () => {
    try {
      setIsLoading(true)

      const response =
        await driverArrivingAPI(
          currentRide.id
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      toast.success(
        'Passenger notified that you are on the way'
      )
    } catch (error) {
      console.error(
        'Driver arriving error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to update ride status'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Driver arrived
  // --------------------------------------------------

  const handleDriverArrived = async () => {
    try {
      setIsLoading(true)

      const response =
        await driverArrivedAPI(
          currentRide.id
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      toast.success(
        'Passenger has been notified that you arrived'
      )
    } catch (error) {
      console.error(
        'Driver arrived error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to update arrival status'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Open OTP modal
  // --------------------------------------------------

  const handleOpenOtpModal = () => {
    setOtp('')
    setOtpModalOpen(true)
  }

  // --------------------------------------------------
  // Close OTP modal
  // --------------------------------------------------

  const handleCloseOtpModal = () => {
    if (isLoading) {
      return
    }

    setOtp('')
    setOtpModalOpen(false)
  }

  // --------------------------------------------------
  // Verify OTP
  // --------------------------------------------------

  const handleVerifyOtp = async (value) => {
    const cleanOtp = String(value || '').trim()

    if (!/^\d{4,6}$/.test(cleanOtp)) {
      toast.error(
        'Enter the 4 to 6 digit passenger OTP'
      )

      return
    }

    try {
      setIsLoading(true)

      const response =
        await verifyRideOtpAPI(
          currentRide.id,
          cleanOtp
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      setOtp('')
      setOtpModalOpen(false)

      toast.success(
        'OTP verified successfully'
      )
    } catch (error) {
      console.error(
        'OTP verification error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Invalid OTP'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Start ride
  // --------------------------------------------------

  const handleStartRide = async () => {
    try {
      setIsLoading(true)

      const response =
        await startRideAPI(
          currentRide.id
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      toast.success(
        'Ride started'
      )
    } catch (error) {
      console.error(
        'Start ride error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to start ride'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Complete ride
  // --------------------------------------------------

  const handleCompleteRide = async () => {
    const parsedFare =
      Number(finalFare)

    if (
      finalFare === '' ||
      Number.isNaN(parsedFare) ||
      parsedFare < 0
    ) {
      toast.error(
        'Enter a valid final fare'
      )

      return
    }

    try {
      setIsLoading(true)

      const response =
        await completeRideAPI(
          currentRide.id,
          parsedFare
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      setFinalFare('')

      toast.success(
        'Ride completed successfully'
      )
    } catch (error) {
      console.error(
        'Complete ride error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to complete ride'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Cancel ride
  // --------------------------------------------------

  const handleCancelRide = async () => {
    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this ride?'
      )

    if (!confirmed) {
      return
    }

    try {
      setIsLoading(true)

      const response =
        await cancelRideAPI(
          currentRide.id
        )

      const updatedRide =
        getResponseData(response)

      updateRide(updatedRide)

      toast.success(
        'Ride cancelled'
      )
    } catch (error) {
      console.error(
        'Cancel ride error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to cancel ride'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // --------------------------------------------------
  // Display values
  // --------------------------------------------------

  const passengerName =
    getPassengerName()

  const distance =
    currentRide.distanceKm != null
      ? `${Number(
          currentRide.distanceKm
        ).toFixed(1)} km`
      : '--'

  const duration =
    currentRide.durationMinutes != null
      ? `${Math.round(
          Number(
            currentRide.durationMinutes
          )
        )} min`
      : '--'

  const estimatedFare =
    currentRide.estimatedFare != null
      ? `₹${Number(
          currentRide.estimatedFare
        ).toFixed(0)}`
      : '--'

  const status =
    currentRide.status

  const canCancel = [
    'ACCEPTED',
    'DRIVER_ARRIVING',
    'DRIVER_ARRIVED',
  ].includes(status)

  // --------------------------------------------------
  // Status configuration
  // --------------------------------------------------

  const statusConfig = {
    ACCEPTED: {
      label: 'Ride Accepted',
      description:
        'Start driving toward the passenger.',
    },

    DRIVER_ARRIVING: {
      label: 'On the Way',
      description:
        'You are on the way to the passenger.',
    },

    DRIVER_ARRIVED: {
      label: 'Arrived',
      description:
        'Ask the passenger for their OTP.',
    },

    OTP_VERIFIED: {
      label: 'OTP Verified',
      description:
        'The passenger has been verified.',
    },

    IN_PROGRESS: {
      label: 'Ride In Progress',
      description:
        'Take the passenger to the destination.',
    },

    COMPLETED: {
      label: 'Completed',
      description:
        'This ride has been completed.',
    },

    CANCELLED: {
      label: 'Cancelled',
      description:
        'This ride has been cancelled.',
    },
  }

  const statusInfo =
    statusConfig[status] || {
      label: status,
      description:
        'Ride status updated.',
    }

  // --------------------------------------------------
  // Action section
  // --------------------------------------------------

  const renderAction = () => {
    if (status === 'ACCEPTED') {
      return (
        <button
          type="button"
          onClick={handleDriverArriving}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Navigation className="h-4 w-4" />

          {isLoading
            ? 'Updating...'
            : 'Start Driving to Passenger'}
        </button>
      )
    }

    if (
      status ===
      'DRIVER_ARRIVING'
    ) {
      return (
        <button
          type="button"
          onClick={handleDriverArrived}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MapPin className="h-4 w-4" />

          {isLoading
            ? 'Updating...'
            : "I've Arrived"}
        </button>
      )
    }

    if (
      status ===
      'DRIVER_ARRIVED'
    ) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-gray-700" />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Passenger verification required
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Ask the passenger for the OTP
                  shown in their application.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenOtpModal}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />

            Enter Passenger OTP
          </button>
        </div>
      )
    }

    if (
      status ===
      'OTP_VERIFIED'
    ) {
      return (
        <button
          type="button"
          onClick={handleStartRide}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="h-4 w-4" />

          {isLoading
            ? 'Starting...'
            : 'Start Ride'}
        </button>
      )
    }

    if (
      status ===
      'IN_PROGRESS'
    ) {
      return (
        <div className="space-y-3">
          <div>
            <label
              htmlFor={`final-fare-${currentRide.id}`}
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Final fare
            </label>

            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id={`final-fare-${currentRide.id}`}
                type="number"
                min="0"
                step="1"
                value={finalFare}
                onChange={(event) =>
                  setFinalFare(
                    event.target.value
                  )
                }
                placeholder={
                  currentRide.estimatedFare
                    ? String(
                        Number(
                          currentRide.estimatedFare
                        ).toFixed(0)
                      )
                    : 'Enter final fare'
                }
                className="w-full rounded-lg border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompleteRide}
            disabled={
              isLoading ||
              finalFare === ''
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />

            {isLoading
              ? 'Completing...'
              : 'Complete Ride'}
          </button>
        </div>
      )
    }

    if (
      status ===
      'COMPLETED'
    ) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
          <CheckCircle2 className="h-4 w-4" />

          Ride Completed
        </div>
      )
    }

    if (
      status ===
      'CANCELLED'
    ) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
          Ride Cancelled
        </div>
      )
    }

    return null
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* Status */}

        <div className="border-b border-gray-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-800" />

                <h3 className="font-semibold text-gray-900">
                  {statusInfo.label}
                </h3>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {statusInfo.description}
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {status}
            </span>
          </div>
        </div>

        {/* Passenger */}

        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="font-semibold text-gray-900">
                  {passengerName}
                </p>

                {currentRide.passenger
                  ?.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="h-3.5 w-3.5" />

                    {
                      currentRide.passenger
                        .phone
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">
                Estimated fare
              </p>

              <p className="mt-1 text-lg font-semibold text-gray-900">
                {estimatedFare}
              </p>
            </div>
          </div>
        </div>

        {/* Route */}

        <div className="p-5">
          <div className="relative space-y-6">

            <div className="absolute left-[7px] top-3 h-[calc(100%-28px)] w-px bg-gray-300" />

            {/* Pickup */}

            <div className="relative flex gap-3">
              <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-[3px] border-gray-800 bg-white" />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Pickup
                </p>

                <p className="mt-1 text-sm font-medium leading-5 text-gray-900">
                  {currentRide.pickup
                    ?.address ||
                    'Pickup location'}
                </p>
              </div>
            </div>

            {/* Destination */}

            <div className="relative flex gap-3">
              <div className="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Destination
                </p>

                <p className="mt-1 text-sm font-medium leading-5 text-gray-900">
                  {currentRide.destination
                    ?.address ||
                    'Destination'}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics */}

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Navigation className="h-4 w-4" />

                <span className="text-xs">
                  Distance
                </span>
              </div>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {distance}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock3 className="h-4 w-4" />

                <span className="text-xs">
                  Duration
                </span>
              </div>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {duration}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-gray-400">
                <IndianRupee className="h-4 w-4" />

                <span className="text-xs">
                  Estimated
                </span>
              </div>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {estimatedFare}
              </p>
            </div>
          </div>

          {/* Action */}

          <div className="mt-6">
            {renderAction()}
          </div>

          {/* Cancel */}

          {canCancel && (
            <button
              type="button"
              onClick={handleCancelRide}
              disabled={isLoading}
              className="mt-3 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel Ride
            </button>
          )}
        </div>
      </div>

      {/* OTP Modal */}

      <DriverOtpModal
        isOpen={otpModalOpen}
        otp={otp}
        onOtpChange={setOtp}
        onVerify={handleVerifyOtp}
        onClose={handleCloseOtpModal}
        isLoading={isLoading}
      />
    </>
  )
}