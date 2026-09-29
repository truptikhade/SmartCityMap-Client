'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Car,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Ticket,
  TrainFront,
  BusFront,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { useAuth } from '../../hooks/useAuth'
import {
  cancelBookingAPI,
  getMyBookingsAPI,
} from '../../api/booking.api'
import {
  getPassengerRidesAPI,
  cancelRideAPI,
} from '../../api/ride.api'

import Navbar from '../ui/Navbar'

const bookingStatusClass = {
  confirmed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
}

const rideStatusClass = {
  REQUESTED: 'bg-yellow-50 text-yellow-700',
  ACCEPTED: 'bg-blue-50 text-blue-700',
  DRIVER_ARRIVING: 'bg-blue-50 text-blue-700',
  DRIVER_ARRIVED: 'bg-indigo-50 text-indigo-700',
  OTP_VERIFIED: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

const vehicleLabels = {
  car: 'Car',
  auto: 'Auto',
  twoWheeler: 'Two Wheeler',
}

export default function MyBookingsPage() {
  const router = useRouter()

  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth()

  const [bookings, setBookings] = useState([])
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ])

  useEffect(() => {
    if (!isAuthenticated) return

    const loadBookings = async () => {
      setLoading(true)

      try {
        const [
          bookingResponse,
          rideResponse,
        ] = await Promise.all([
          getMyBookingsAPI(),
          getPassengerRidesAPI(),
        ])

        setBookings(
          bookingResponse.data?.data || []
        )

        setRides(
          rideResponse?.data || []
        )
      } catch (error) {
        console.error(
          'Could not load bookings:',
          error
        )

        toast.error(
          error.response?.data?.message ||
            'Could not load your bookings'
        )
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [isAuthenticated])

  const combinedTrips = useMemo(() => {
    const transitItems = bookings.map(
      (booking) => ({
        ...booking,
        recordType: 'transit',
        sortDate:
          booking.bookedAt ||
          booking.travelDate ||
          null,
      })
    )

    const rideItems = rides.map(
      (ride) => ({
        ...ride,
        recordType: 'ride',
        sortDate:
          ride.requestedAt ||
          ride.acceptedAt ||
          null,
      })
    )

    return [
      ...transitItems,
      ...rideItems,
    ].sort((a, b) => {
      const first = a.sortDate
        ? new Date(a.sortDate).getTime()
        : 0

      const second = b.sortDate
        ? new Date(b.sortDate).getTime()
        : 0

      return second - first
    })
  }, [bookings, rides]).slice(0,5)

  const cancelTransitBooking = async (
    bookingId
  ) => {
    try {
      await cancelBookingAPI(bookingId)

      setBookings((items) =>
        items.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                status: 'cancelled',
              }
            : item
        )
      )

      toast.success('Booking cancelled')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not cancel booking'
      )
    }
  }

  const cancelOnDemandRide = async (
    rideId
  ) => {
    try {
      await cancelRideAPI(rideId)

      setRides((items) =>
        items.map((item) =>
          item.id === rideId
            ? {
                ...item,
                status: 'CANCELLED',
              }
            : item
        )
      )

      toast.success('Ride cancelled')
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not cancel ride'
      )
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2
          size={22}
          className="animate-spin text-gray-400"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div>

          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            My bookings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            All rides in one place.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {combinedTrips.length === 0 ? (
            <EmptyBookings />
          ) : (
            combinedTrips.map((item) =>
              item.recordType === 'transit' ? (
                <TransitBookingCard
                  key={`booking-${item.id}`}
                  booking={item}
                  onCancel={cancelTransitBooking}
                />
              ) : (
                <RideBookingCard
                  key={`ride-${item.id}`}
                  ride={item}
                  onCancel={cancelOnDemandRide}
                />
              )
            )
          )}
        </div>
      </main>
    </div>
  )
}

function EmptyBookings() {
  return (
    <div className="border border-gray-200 bg-white px-5 py-14 text-center">

      <p className="mt-3 text-sm font-medium text-gray-700">
        No Booking yet!
      </p>

    </div>
  )
}

function TransitBookingCard({
  booking,
  onCancel,
}) {
  const status =
    booking.status?.toLowerCase()

  const transitType =
    booking.transitType?.toLowerCase()

  const isBus = transitType === 'bus'

  const canCancel =
    status === 'confirmed' ||
    status === 'pending'

  return (
    <article className="border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {isBus ? (
              <BusFront size={18} />
            ) : (
              <TrainFront size={18} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-gray-900">
                {booking.route?.routeName ||
                  'Transit booking'}
              </h2>

              <span className="shrink-0 text-[11px] font-medium capitalize text-gray-400">
                {transitType || 'transit'}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />

              {booking.boardingStop?.stopName ||
                'Boarding'}

              <span>-</span>

              {booking.dropStop?.stopName ||
                'Drop'}
            </p>
          </div>
        </div>

        <StatusBadge
          status={booking.status}
          classMap={bookingStatusClass}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          icon={<CalendarDays size={13} />}
          label="Travel date"
          value={
            booking.travelDate
              ? formatDate(booking.travelDate)
              : '—'
          }
        />

        <Detail
          icon={<Clock3 size={13} />}
          label="Departure"
          value={
            booking.trip?.departureTime ||
            '—'
          }
        />

        <Detail
          icon={<IndianRupee size={13} />}
          label="Fare"
          value={`₹${Math.round(
            Number(booking.farePaid || 0)
          )}`}
        />
      </div>

      {booking.seatNumber && (
        <div className="mt-3 text-xs text-gray-500">
          Seat{' '}
          <span className="font-medium text-gray-700">
            {booking.seatNumber}
          </span>
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={() =>
            onCancel(booking.id)
          }
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
        >
          <X size={13} />
          Cancel booking
        </button>
      )}
    </article>
  )
}

function RideBookingCard({
  ride,
  onCancel,
}) {
  const vehicleType =
    ride.vehicleType || 'car'

  const vehicleLabel =
    vehicleLabels[vehicleType] ||
    vehicleType

  const status =
    String(ride.status || '')
      .toUpperCase()

  const canCancel = [
    'REQUESTED',
    'ACCEPTED',
    'DRIVER_ARRIVING',
    'DRIVER_ARRIVED',
  ].includes(status)

  const driverName = [
    ride.driver?.fname,
    ride.driver?.lname,
  ]
    .filter(Boolean)
    .join(' ')

  const distance =
    ride.distanceKm != null
      ? `${Number(ride.distanceKm).toFixed(1)} km`
      : '—'

  const duration =
    ride.durationMinutes != null
      ? `${Math.round(
          Number(ride.durationMinutes)
        )} min`
      : '—'

  const fare =
    ride.finalFare ??
    ride.estimatedFare ??
    0

  return (
    <article className="border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Car size={18} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                {vehicleLabel} ride
              </h2>

              {ride.vehicle?.vehicleNumber && (
                <span className="truncate text-[11px] text-gray-400">
                  {ride.vehicle.vehicleNumber}
                </span>
              )}
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />

              <span className="truncate">
                {ride.pickupAddress ||
                  'Pickup'}
              </span>

              <span>-</span>

              <span className="truncate">
                {ride.destinationAddress ||
                  'Destination'}
              </span>
            </p>
          </div>
        </div>

        <StatusBadge
          status={status}
          classMap={rideStatusClass}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          icon={<CalendarDays size={13} />}
          label="Requested"
          value={
            ride.requestedAt
              ? formatDateTime(
                  ride.requestedAt
                )
              : '—'
          }
        />

        <Detail
          icon={<Clock3 size={13} />}
          label="Duration"
          value={duration}
        />

        <Detail
          icon={<IndianRupee size={13} />}
          label="Fare"
          value={`₹${Math.round(
            Number(fare)
          )}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
        <span>
          Distance{' '}
          <span className="font-medium text-gray-700">
            {distance}
          </span>
        </span>

        {driverName && (
          <span>
            Driver{' '}
            <span className="font-medium text-gray-700">
              {driverName}
            </span>
          </span>
        )}

        {ride.driver?.phone && (
          <span>
            {ride.driver.phone}
          </span>
        )}
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() =>
            onCancel(ride.id)
          }
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
        >
          <X size={13} />
          Cancel ride
        </button>
      )}
    </article>
  )
}

function StatusBadge({
  status,
  classMap,
}) {
  const normalized =
    String(status || '')
      .toLowerCase()

  const className =
    classMap[status] ||
    classMap[normalized] ||
    'bg-gray-100 text-gray-600'

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${className}`}
    >
      {formatStatus(status)}
    </span>
  )
}

function Detail({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  )
}

function formatStatus(status) {
  if (!status) return 'Unknown'

  return String(status)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    )
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    )
  } catch {
    return '—'
  }
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }
    )
  } catch {
    return '—'
  }
}