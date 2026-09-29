'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import {
  Armchair,
  CalendarDays,
  ChevronDown,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../../hooks/useAuth'
import { createBookingAPI } from '../../api/booking.api'
import {
  initiatePaymentAPI,
  verifyPaymentAPI,
} from '../../api/payment.api'
import {
  getStopsAPI,
  getTripsAPI,
} from '../../api/transit.api'

import Navbar from '../ui/Navbar'

export default function BookingPage() {
  const router = useRouter()

  const {
    isAuthenticated,
    loading: authLoading,
    user,
  } = useAuth()

  const [bookingData, setBookingData] = useState(null)

  const [stops, setStops] = useState([])
  const [trips, setTrips] = useState([])

  const [boardingStop, setBoardingStop] = useState('')
  const [dropStop, setDropStop] = useState('')
  const [seatNumber, setSeatNumber] = useState('')

  const [travelDate, setTravelDate] = useState('')

  const [tripId, setTripId] = useState('')

  const [loading, setLoading] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)

  /*
   * --------------------------------------------------
   * AUTH
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      router.push('/login')
    }
  }, [
    authLoading,
    isAuthenticated,
    router,
  ])

  /*
   * --------------------------------------------------
   * LOAD SELECTED BOOKING
   * --------------------------------------------------
   */

  useEffect(() => {
    const stored =
      sessionStorage.getItem(
        'bookingData'
      )

    if (!stored) {
      router.push('/transit')
      return
    }

    try {
      const data =
        JSON.parse(stored)

      /*
       * The selected route can come from
       * different parts of the booking object.
       *
       * Normalize it here so the rest of this
       * page always uses bookingData.routeId.
       */
      const normalizedRouteId =
        data.routeId ||
        data.route?.id ||
        data.route?.routeId ||
        data.option?.routeId ||
        data.option?.route?.id ||
        null

      /*
       * Same for trip.
       */
      const normalizedTripId =
        data.tripId ||
        data.trip?.id ||
        data.option?.tripId ||
        data.option?.trip?.id ||
        null

      const normalizedData = {
        ...data,

        routeId:
          normalizedRouteId,

        tripId:
          normalizedTripId,

        route:
          data.route || {
            id: normalizedRouteId,
            routeId: normalizedRouteId,
            routeName:
              `${data.from?.name || 'Origin'} → ${
                data.to?.name ||
                'Destination'
              }`,
          },

        trip:
          data.trip ||
          data.option?.trip ||
          null,
      }

      console.log(
        'BOOKING DATA LOADED:',
        normalizedData
      )

      console.log(
        'SELECTED ROUTE ID:',
        normalizedRouteId
      )

      console.log(
        'SELECTED TRIP ID:',
        normalizedTripId
      )

      setBookingData(
        normalizedData
      )

      setBoardingStop(
        data.boardingStop?.id ||
          data.boardingStopId ||
          ''
      )

      setDropStop(
        data.dropStop?.id ||
          data.dropStopId ||
          ''
      )

      const today =
        new Date()
          .toISOString()
          .split('T')[0]

      setTravelDate(
        data.travelDate
          ? new Date(
              data.travelDate
            )
              .toISOString()
              .split('T')[0]
          : today
      )

      setTripId(
        normalizedTripId
          ? String(normalizedTripId)
          : ''
      )
    } catch (error) {
      console.error(
        'Invalid booking data:',
        error
      )

      sessionStorage.removeItem(
        'bookingData'
      )

      router.push('/transit')
    }
  }, [router])

  /*
   * --------------------------------------------------
   * LOAD STOPS FOR SELECTED ROUTE
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !bookingData?.routeId
    ) {
      return
    }

    const loadStops = async () => {
      try {
        console.log(
          'Loading stops for route:',
          bookingData.routeId
        )

        const response =
          await getStopsAPI(
            bookingData.routeId
          )

        const data =
          response.data?.data || []

        console.log(
          'STOPS:',
          data
        )

        setStops(data)
      } catch (error) {
        console.error(
          'Could not load stops:',
          error
        )

        setStops([])

        toast.error(
          'Could not load route stops'
        )
      }
    }

    loadStops()
  }, [
    bookingData?.routeId,
  ])

  /*
   * --------------------------------------------------
   * LOAD TRIPS
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !bookingData?.routeId ||
      !travelDate
    ) {
      return
    }

    const loadTrips = async () => {
      try {
        console.log(
          'Loading trips:',
          {
            routeId:
              bookingData.routeId,
            travelDate,
          }
        )

        const response =
          await getTripsAPI(
            bookingData.routeId,
            travelDate
          )

        const available =
          (
            response.data?.data ||
            []
          ).filter(
            (trip) =>
              Number(
                trip.availableSeats
              ) > 0
          )

        console.log(
          'AVAILABLE TRIPS:',
          available
        )

        setTrips(available)

        /*
         * Keep the trip that was selected
         * from the Travel Options screen.
         */
        const selectedStillAvailable =
          available.some(
            (trip) =>
              String(trip.id) ===
              String(tripId)
          )

        if (
          !selectedStillAvailable
        ) {
          /*
           * If the previously selected trip
           * is not available for this date,
           * choose the first available trip.
           */
          const firstTrip =
            available[0]

          if (firstTrip) {
            setTripId(
              String(firstTrip.id)
            )
          }
        }
      } catch (error) {
        console.error(
          'Could not load trips:',
          error
        )

        setTrips([])
      }
    }

    loadTrips()

    /*
     * We intentionally don't include tripId
     * here because changing the selected trip
     * should not refetch the trips.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookingData?.routeId,
    travelDate,
  ])

  /*
   * --------------------------------------------------
   * SELECTED TRIP
   * --------------------------------------------------
   */

  const selectedTrip =
    trips.find(
      (trip) =>
        String(trip.id) ===
        String(tripId)
    ) ||
    bookingData?.trip ||
    null

  /*
   * --------------------------------------------------
   * FARE
   * --------------------------------------------------
   */

  const fare = useMemo(() => {
    return Number(
      bookingData?.baseFare ??
        bookingData?.fare ??
        bookingData?.estimatedFare ??
        0
    )
  }, [bookingData])

  /*
   * --------------------------------------------------
   * ROUTE NAME
   * --------------------------------------------------
   */

  const routeName =
    bookingData?.route?.routeName ||
    bookingData?.routeName ||
    `${bookingData?.from?.name || 'Origin'} → ${
      bookingData?.to?.name ||
      'Destination'
    }`

  /*
   * --------------------------------------------------
   * TRANSPORT TYPE
   * --------------------------------------------------
   */

  const transportType =
    bookingData?.transitType ||
    bookingData?.transportType ||
    bookingData?.option?.transitType ||
    'Transit'

  /*
   * --------------------------------------------------
   * CONFIRM BOOKING
   * --------------------------------------------------
   */

  const confirmBooking = async () => {
    if (!bookingData) {
      return
    }

    /*
     * Route must already come from the
     * selected Travel Option.
     */
    const selectedRouteId =
      bookingData.routeId ||
      bookingData.route?.id ||
      bookingData.route?.routeId ||
      bookingData.option?.routeId ||
      bookingData.option?.route?.id ||
      null

    /*
     * Trip must already come from the
     * selected Travel Option or selected
     * departure.
     */
    const selectedTripId =
      tripId ||
      bookingData.tripId ||
      bookingData.trip?.id ||
      bookingData.option?.tripId ||
      bookingData.option?.trip?.id ||
      null

    console.log(
      'CONFIRM BOOKING:',
      {
        routeId:
          selectedRouteId,
        tripId:
          selectedTripId,
        boardingStop,
        dropStop,
        travelDate,
        fare,
      }
    )

    /*
     * Route should NEVER need to be selected
     * again here.
     */
    if (!selectedRouteId) {
      toast.error(
        'The selected transport route could not be found. Please go back and select Book again.'
      )
      return
    }

    if (!boardingStop) {
      toast.error(
        'Select boarding stop'
      )
      return
    }

    if (!dropStop) {
      toast.error(
        'Select drop stop'
      )
      return
    }

    if (
      String(boardingStop) ===
      String(dropStop)
    ) {
      toast.error(
        'Boarding and drop stop must be different'
      )
      return
    }

    if (!selectedTripId) {
      toast.error(
        'No available trip was found for this route'
      )
      return
    }

    if (
      !scriptReady ||
      !window.Razorpay
    ) {
      toast.error(
        'Payment is still loading. Please try again.'
      )
      return
    }

    setLoading(true)

    try {
      /*
       * CREATE BOOKING
       */
      const bookingResponse =
        await createBookingAPI({
          routeId:
            selectedRouteId,

          tripId:
            selectedTripId,

          boardingStopId:
            boardingStop,

          dropStopId:
            dropStop,

          transitType:
            transportType,

          seatNumber:
            seatNumber || null,

          farePaid:
            fare,

          travelDate,
        })

      const booking =
        bookingResponse.data?.data

      if (!booking?.id) {
        throw new Error(
          'Booking was not created'
        )
      }

      /*
       * INITIATE PAYMENT
       */
      const paymentResponse =
        await initiatePaymentAPI({
          bookingId:
            booking.id,
        })

      const payment =
        paymentResponse.data?.data

      if (!payment) {
        throw new Error(
          'Could not initialize payment'
        )
      }

      /*
       * RAZORPAY
       */
      const razorpay =
        new window.Razorpay({
          key:
            payment.keyId,

          amount:
            payment.amount,

          currency:
            payment.currency,

          order_id:
            payment.orderId,

          name:
            'SmartCity',

          description:
            `${routeName} booking`,

          prefill: {
            name: user
              ? `${user.fname || ''} ${
                  user.lname || ''
                }`.trim()
              : '',

            email:
              user?.email || '',

            contact:
              user?.phone || '',
          },

          theme: {
            color:
              '#2563eb',
          },

          handler:
            async (
              response
            ) => {
              try {
                await verifyPaymentAPI(
                  {
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    bookingId:
                      booking.id,
                  }
                )

                sessionStorage.removeItem(
                  'bookingData'
                )

                toast.success(
                  'Payment successful'
                )

                router.push(
                  '/bookings'
                )
              } catch (error) {
                console.error(
                  'Payment verification error:',
                  error
                )

                toast.error(
                  error.response?.data
                    ?.message ||
                    'Payment verification failed'
                )

                setLoading(false)
              }
            },

          modal: {
            ondismiss: () => {
              setLoading(false)
            },
          },
        })

      razorpay.open()
    } catch (error) {
      console.error(
        'Booking error:',
        error
      )

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Could not create booking'
      )

      setLoading(false)
    }
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (
    authLoading ||
    !bookingData
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2
          className="animate-spin text-gray-500"
          size={22}
        />
      </div>
    )
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() =>
          setScriptReady(true)
        }
        onError={() => {
          toast.error(
            'Could not load payment gateway'
          )
        }}
      />

      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* HEADER */}
        <div className="mb-7">
          <p className="text-sm font-medium text-blue-600">
            Booking
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Confirm your journey
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your selected route has already been carried
            from the journey planner.
          </p>
        </div>

        {/* SELECTED ROUTE */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <Ticket
              size={19}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Selected route
              </p>

              <h2 className="mt-1 text-sm font-semibold text-gray-900">
                {routeName}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {bookingData.from?.name ||
                  'Origin'}
                {' - '}
                {bookingData.to?.name ||
                  'Destination'}
              </p>

              <p className="mt-2 text-xs font-medium capitalize text-gray-600">
                {transportType.replace(
                  '-',
                  ' '
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info
              icon={
                <CalendarDays
                  size={15}
                />
              }
              label="Travel date"
              value={
                travelDate ||
                'Select date'
              }
            />

            <Info
              icon={
                <Clock3
                  size={15}
                />
              }
              label="Departure"
              value={
                selectedTrip?.departureTime ||
                'Select trip'
              }
            />

            <Info
              icon={
                <IndianRupee
                  size={15}
                />
              }
              label="Fare"
              value={`₹${Math.round(
                fare
              )}`}
            />
          </div>
        </section>

        {/* JOURNEY DETAILS */}
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            Journey details
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Select where you will board and where you will
            get off.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Boarding stop"
              value={boardingStop}
              onChange={
                setBoardingStop
              }
              options={stops}
            />

            <SelectField
              label="Drop stop"
              value={dropStop}
              onChange={
                setDropStop
              }
              options={stops}
            />
          </div>

          {/* DATE */}
          <label className="mt-4 block text-xs font-medium text-gray-600">
            Travel date
          </label>

          <input
            type="date"
            value={travelDate}
            min={
              new Date()
                .toISOString()
                .split('T')[0]
            }
            onChange={(event) =>
              setTravelDate(
                event.target.value
              )
            }
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm !text-gray-900 outline-none focus:border-blue-500"
          />

          {/* TRIP */}
          {trips.length > 0 && (
            <>
              <label className="mt-4 block text-xs font-medium text-gray-600">
                Departure
              </label>

              <select
                value={tripId}
                onChange={(event) =>
                  setTripId(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm !text-gray-900 outline-none focus:border-blue-500"
              >
                {trips.map(
                  (trip) => (
                    <option
                      key={trip.id}
                      value={trip.id}
                    >
                      {trip.departureTime}

                      {trip.vehicleNumber
                        ? ` · ${trip.vehicleNumber}`
                        : ''}

                      {' · '}

                      {trip.availableSeats}{' '}
                      seats
                    </option>
                  )
                )}
              </select>
            </>
          )}

          {/* SELECTED TRIP FALLBACK */}
          {trips.length === 0 &&
            selectedTrip && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">
                  Selected departure
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {selectedTrip.departureTime ||
                    'Departure selected'}
                </p>
              </div>
            )}

          {/* SEAT */}
          <label className="mt-4 block text-xs font-medium text-gray-600">
            Seat number (optional)
          </label>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
            <Armchair
              size={16}
              className="text-gray-400"
            />

            <input
              value={seatNumber}
              onChange={(event) =>
                setSeatNumber(
                  event.target.value
                )
              }
              placeholder="Example: A1"
              className="w-full py-3 text-sm !text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
        </section>

        {/* PAYMENT */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total
            </span>

            <span className="flex items-center text-lg font-semibold text-gray-950">
              <IndianRupee
                size={17}
              />

              {Math.round(
                fare
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={
              confirmBooking
            }
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {loading
              ? 'Processing...'
              : 'Pay and confirm'}
          </button>
        </div>
      </main>
    </div>
  )
}

/*
 * --------------------------------------------------
 * INFO COMPONENT
 * --------------------------------------------------
 */

function Info({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-gray-900">
        {value}
      </p>
    </div>
  )
}

/*
 * --------------------------------------------------
 * SELECT FIELD
 * --------------------------------------------------
 */

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">
        {label}
      </span>

      <div className="relative mt-2">
        <MapPin
          size={15}
          className="pointer-events-none absolute left-3 top-3.5 text-gray-400"
        />

        <select
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-3 pl-9 pr-9 text-sm !text-gray-900 outline-none focus:border-blue-500"
        >
          <option value="">
            Select stop
          </option>

          {options.map(
            (stop) => (
              <option
                key={stop.id}
                value={stop.id}
              >
                {stop.stopOrder}.{' '}
                {stop.stopName}
              </option>
            )
          )}
        </select>

        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-3.5 text-gray-400"
        />
      </div>
    </label>
  )
}