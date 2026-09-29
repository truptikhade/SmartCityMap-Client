'use client'

import { useState } from 'react'
import {
  Car,
  Clock3,
  IndianRupee,
  MapPin,
  Navigation,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { acceptRideAPI } from '../../api/driver.api'

export default function RideRequestCard({
  ride,
  vehicle,
  onAccepted,
}) {
  const [isAccepting, setIsAccepting] =
    useState(false)

  if (!ride) {
    return null
  }

  // --------------------------------------------------
  // Accept ride
  // --------------------------------------------------

  const handleAccept = async () => {
    if (!vehicle?.id) {
      toast.error(
        'No active vehicle is available for this ride'
      )

      return
    }

    if (
      ride.vehicleType &&
      vehicle.vehicleType &&
      ride.vehicleType !==
        vehicle.vehicleType
    ) {
      toast.error(
        `This ride requires a ${ride.vehicleType} vehicle`
      )

      return
    }

    try {
      setIsAccepting(true)

      const response =
        await acceptRideAPI(
          ride.id,
          vehicle.id
        )

      const acceptedRide =
        response?.data ||
        response

      toast.success(
        'Ride accepted successfully'
      )

      if (onAccepted) {
        onAccepted(
          acceptedRide
        )
      }
    } catch (error) {
      console.error(
        'Accept ride error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to accept ride'
      )
    } finally {
      setIsAccepting(false)
    }
  }

  // --------------------------------------------------
  // Format values
  // --------------------------------------------------

  const distance =
    ride.distanceKm != null
      ? `${Number(
          ride.distanceKm
        ).toFixed(1)} km`
      : 'Distance unavailable'

  const duration =
    ride.durationMinutes != null
      ? `${Math.round(
          Number(
            ride.durationMinutes
          )
        )} min`
      : 'Duration unavailable'

  const fare =
    ride.estimatedFare != null
      ? `₹${Number(
          ride.estimatedFare
        ).toFixed(0)}`
      : 'Fare unavailable'

  const passengerName =
    ride.passenger
      ? `${ride.passenger.fname || ''} ${
          ride.passenger.lname || ''
        }`.trim()
      : 'Passenger'

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* -------------------------------------------- */}
      {/* Header */}
      {/* -------------------------------------------- */}

      <div className="flex items-start justify-between border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <User className="h-5 w-5 text-gray-600" />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900">
              {passengerName}
            </h3>

            {ride.passenger?.phone && (
              <p className="text-sm text-gray-500">
                {ride.passenger.phone}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium capitalize text-gray-700">
          {ride.vehicleType ||
            'Ride'}
        </div>
      </div>

      {/* -------------------------------------------- */}
      {/* Route */}
      {/* -------------------------------------------- */}

      <div className="p-5">
        <div className="relative space-y-5">
          {/* Vertical route line */}

          <div className="absolute left-[7px] top-3 h-[calc(100%-24px)] w-px bg-gray-300" />

          {/* Pickup */}

          <div className="relative flex gap-3">
            <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-[3px] border-gray-700 bg-white" />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Pickup
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {ride.pickup?.address ||
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

              <p className="mt-1 text-sm font-medium text-gray-900">
                {ride.destination?.address ||
                  'Destination'}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------ */}
        {/* Ride details */}
        {/* ------------------------------------------ */}

        <div className="mt-6 grid grid-cols-3 gap-3">
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
                Fare
              </span>
            </div>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {fare}
            </p>
          </div>
        </div>

        {/* ------------------------------------------ */}
        {/* Vehicle */}
        {/* ------------------------------------------ */}

        <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <Car className="h-5 w-5 text-gray-600" />
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Your vehicle
              </p>

              <p className="text-sm font-semibold capitalize text-gray-900">
                {vehicle?.brand
                  ? `${vehicle.brand} ${
                      vehicle.model || ''
                    }`
                  : vehicle?.vehicleType ||
                    'Vehicle'}
              </p>
            </div>
          </div>

          {vehicle?.vehicleNumber && (
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {vehicle.vehicleNumber}
            </span>
          )}
        </div>

        {/* ------------------------------------------ */}
        {/* Accept */}
        {/* ------------------------------------------ */}

        <button
          type="button"
          onClick={handleAccept}
          disabled={
            isAccepting ||
            !vehicle?.id
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAccepting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

              Accepting...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />

              Accept Ride
            </>
          )}
        </button>

        {!vehicle?.id && (
          <p className="mt-2 text-center text-xs text-red-500">
            No active vehicle found. Please
            activate a vehicle before accepting
            rides.
          </p>
        )}
      </div>
    </div>
  )
}