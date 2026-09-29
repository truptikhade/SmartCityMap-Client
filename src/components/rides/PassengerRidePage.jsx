'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'

import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import {
  cancelRideAPI,
  getRideAPI,
} from '../../api/ride.api'

const POLL_INTERVAL = 15000
const RATE_LIMIT_RETRY_INTERVAL = 60000

const STATUS_CONFIG = {
  REQUESTED: {
    title: 'Finding your driver',
    description:
      'We are looking for an available driver nearby.',
  },

  ACCEPTED: {
    title: 'Driver accepted',
    description:
      'Your driver has accepted the ride.',
  },

  DRIVER_ARRIVING: {
    title: 'Driver is on the way',
    description:
      'Your driver is coming to the pickup location.',
  },

  DRIVER_ARRIVED: {
    title: 'Driver has arrived',
    description:
      'Your driver is waiting at the pickup location.',
  },

  OTP_VERIFIED: {
    title: 'Ride starting',
    description:
      'Your OTP has been verified.',
  },

  IN_PROGRESS: {
    title: 'Ride in progress',
    description:
      'You are on your way to your destination.',
  },

  COMPLETED: {
    title: 'Ride completed',
    description:
      'You have reached your destination.',
  },

  CANCELLED: {
    title: 'Ride cancelled',
    description:
      'This ride has been cancelled.',
  },

  REJECTED: {
    title: 'Ride unavailable',
    description:
      'This ride request is no longer available.',
  },
}

export default function PassengerRidePage() {
  const params = useParams()
  const router = useRouter()

  const rideId = params?.rideId

  const [ride, setRide] = useState(null)
  const [rideOtp, setRideOtp] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  // --------------------------------------------------
  // Restore OTP from the ride created by the passenger
  // --------------------------------------------------

  useEffect(() => {
    if (!rideId) {
      return
    }

    try {
      const storedRide =
        sessionStorage.getItem('activeRide')

      if (!storedRide) {
        return
      }

      const parsed = JSON.parse(storedRide)

      const storedRideData =
        parsed?.ride

      if (
        String(storedRideData?.id) !==
        String(rideId)
      ) {
        return
      }

      /*
       * OTP is returned only when the ride is created.
       * The GET /api/rides/:id endpoint does not return
       * the plain OTP, so keep it separately from ride state.
       */
      const otp = String(
        storedRideData?.otp || ''
      ).trim()

      if (/^\d{4}$/.test(otp)) {
        setRideOtp(otp)
      }

      /*
       * Use the locally stored ride immediately so
       * the page can render even before the first API
       * request completes.
       */
      setRide((currentRide) => {
        if (currentRide) {
          return currentRide
        }

        return storedRideData || null
      })
    } catch (storageError) {
      console.error(
        'Failed to restore active ride:',
        storageError
      )
    }
  }, [rideId])

  // --------------------------------------------------
  // Load ride
  // --------------------------------------------------

  const loadRide = useCallback(
    async (showLoader = false) => {
      if (!rideId) {
        return {
          success: false,
          rateLimited: false,
          ride: null,
        }
      }

      try {
        if (showLoader) {
          setLoading(true)
        }

        const response =
          await getRideAPI(rideId)

        const data =
          response?.data ||
          response?.ride ||
          response

        if (!data) {
          throw new Error(
            'Ride information is unavailable'
          )
        }

        /*
         * Important:
         *
         * Do NOT replace the entire ride state.
         *
         * The backend GET endpoint intentionally does
         * not return the plain OTP.
         *
         * Merging keeps the locally restored ride OTP
         * safe if it exists.
         */
        setRide((currentRide) => ({
          ...(currentRide || {}),
          ...data,
        }))

        setError('')

        return {
          success: true,
          rateLimited: false,
          ride: data,
        }
      } catch (err) {
        console.error(
          'Failed to load ride:',
          err
        )

        const statusCode =
          err?.response?.status

        /*
         * Rate limited:
         * Do not immediately retry.
         */
        if (statusCode === 429) {
          console.warn(
            'Ride polling was rate limited. Retrying after 60 seconds.'
          )

          return {
            success: false,
            rateLimited: true,
            ride: null,
          }
        }

        /*
         * Keep the locally restored ride visible
         * if the API temporarily fails.
         */
        if (!ride) {
          setError(
            err?.response?.data?.message ||
              'Unable to load ride'
          )
        }

        return {
          success: false,
          rateLimited: false,
          ride: null,
        }
      } finally {
        if (showLoader) {
          setLoading(false)
        }
      }
    },
    [rideId, ride]
  )

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------

  useEffect(() => {
    if (!rideId) {
      return
    }

    loadRide(true)
  }, [rideId])

  // --------------------------------------------------
  // Poll ride status
  // --------------------------------------------------

  useEffect(() => {
    if (!rideId) {
      return
    }

    let cancelled = false
    let timer = null

    const terminalStatuses = [
      'COMPLETED',
      'CANCELLED',
      'REJECTED',
    ]

    const poll = async () => {
      if (cancelled) {
        return
      }

      const result =
        await loadRide(false)

      if (cancelled) {
        return
      }

      const currentStatus =
        String(
          result?.ride?.status || ''
        ).toUpperCase()

      /*
       * Stop polling once the ride reaches
       * a terminal state.
       */
      if (
        terminalStatuses.includes(
          currentStatus
        )
      ) {
        return
      }

      /*
       * Normal polling:
       * 15 seconds
       *
       * Rate limited:
       * 60 seconds
       */
      const nextDelay =
        result?.rateLimited
          ? RATE_LIMIT_RETRY_INTERVAL
          : POLL_INTERVAL

      timer = setTimeout(
        poll,
        nextDelay
      )
    }

    /*
     * Don't immediately hit the API again.
     * The initial load already happens separately.
     */
    timer = setTimeout(
      poll,
      POLL_INTERVAL
    )

    return () => {
      cancelled = true

      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [rideId, loadRide])

  // --------------------------------------------------
  // Cancel ride
  // --------------------------------------------------

  const handleCancel = async () => {
    if (!ride?.id || cancelling) {
      return
    }

    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this ride?'
      )

    if (!confirmed) {
      return
    }

    try {
      setCancelling(true)

      const response =
        await cancelRideAPI(ride.id)

      const updatedRide =
        response?.data ||
        response?.ride

      if (updatedRide) {
        setRide((currentRide) => ({
          ...(currentRide || {}),
          ...updatedRide,
        }))
      } else {
        await loadRide(false)
      }

      toast.success(
        'Ride cancelled'
      )
    } catch (err) {
      console.error(
        'Cancel ride error:',
        err
      )

      toast.error(
        err?.response?.data?.message ||
          'Unable to cancel ride'
      )
    } finally {
      setCancelling(false)
    }
  }

  // --------------------------------------------------
  // Ride status
  // --------------------------------------------------

  const status = String(
    ride?.status || 'REQUESTED'
  ).toUpperCase()

  const statusConfig =
    STATUS_CONFIG[status] ||
    STATUS_CONFIG.REQUESTED

  const isTerminal =
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'REJECTED'

  /*
   * Backend permits cancellation while the driver
   * is already marked as arrived.
   */
  const canCancel =
    status === 'REQUESTED' ||
    status === 'ACCEPTED' ||
    status === 'DRIVER_ARRIVING' ||
    status === 'DRIVER_ARRIVED'

  // --------------------------------------------------
  // Driver / vehicle
  // --------------------------------------------------

  const driver =
    ride?.driver || null

  const vehicle =
    ride?.vehicle || null

  const fare = Number(
    ride?.finalFare ??
      ride?.estimatedFare ??
      0
  )

  const vehicleLabel =
    getVehicleLabel(
      vehicle?.vehicleType ||
        ride?.vehicleType
    )

  // --------------------------------------------------
  // Status steps
  // --------------------------------------------------

  const statusSteps = useMemo(
    () => [
      {
        key: 'REQUESTED',
        label: 'Requested',
      },
      {
        key: 'ACCEPTED',
        label: 'Accepted',
      },
      {
        key: 'DRIVER_ARRIVING',
        label: 'Driver arriving',
      },
      {
        key: 'DRIVER_ARRIVED',
        label: 'Driver arrived',
      },
      {
        key: 'IN_PROGRESS',
        label: 'In progress',
      },
      {
        key: 'COMPLETED',
        label: 'Completed',
      },
    ],
    []
  )

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading && !ride) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Loader2
              size={20}
              className="animate-spin"
            />

            Loading your ride...
          </div>
        </div>
      </main>
    )
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error && !ride) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <XCircle
              size={42}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-4 text-lg font-semibold text-gray-900">
              Ride could not be loaded
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/')
              }
              className="mt-5 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Back to home
            </button>
          </div>
        </div>
      </main>
    )
  }

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">

        {/* Header */}

        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              router.push('/')
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={18} />

            Back
          </button>

          <div className="text-right">
            <p className="text-xs text-gray-400">
              Ride ID
            </p>

            <p className="max-w-[180px] truncate text-xs font-medium text-gray-600">
              {ride?.id}
            </p>
          </div>
        </div>

        {/* Status */}

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {status === 'COMPLETED' ? (
                <CheckCircle2 size={25} />
              ) : status === 'CANCELLED' ||
                status === 'REJECTED' ? (
                <XCircle size={25} />
              ) : (
                <Clock3 size={25} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {statusConfig.title}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {statusConfig.description}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto pb-1">
            <div className="flex min-w-[650px] items-start">
              {statusSteps.map(
                (step, index) => {
                  const active =
                    isStepActive(
                      status,
                      step.key
                    )

                  const completed =
                    isStepCompleted(
                      status,
                      step.key
                    )

                  return (
                    <div
                      key={step.key}
                      className="flex flex-1 items-start"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={[
                            'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold',
                            active ||
                            completed
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-gray-200 bg-white text-gray-400',
                          ].join(' ')}
                        >
                          {completed ? (
                            <CheckCircle2
                              size={15}
                            />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <span
                          className={[
                            'mt-2 whitespace-nowrap text-[11px]',
                            active ||
                            completed
                              ? 'font-medium text-gray-800'
                              : 'text-gray-400',
                          ].join(' ')}
                        >
                          {step.label}
                        </span>
                      </div>

                      {index <
                        statusSteps.length -
                          1 && (
                        <div
                          className={[
                            'mt-4 h-px flex-1',
                            isStepCompleted(
                              status,
                              statusSteps[
                                index + 1
                              ].key
                            )
                              ? 'bg-blue-600'
                              : 'bg-gray-200',
                          ].join(' ')}
                        />
                      )}
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </section>

        {/* Journey */}

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Your journey
          </h2>

          <div className="mt-5 space-y-5">
            <LocationRow
              icon={
                <MapPin size={17} />
              }
              label="Pickup"
              value={
                ride?.pickupAddress ||
                'Pickup location'
              }
            />

            <div className="ml-[9px] h-5 border-l border-dashed border-gray-300" />

            <LocationRow
              icon={
                <MapPin size={17} />
              }
              label="Destination"
              value={
                ride?.destinationAddress ||
                'Destination'
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-4">
            <InfoItem
              label="Vehicle"
              value={vehicleLabel}
            />

            <InfoItem
              label="Distance"
              value={
                ride?.distanceKm
                  ? `${Number(
                      ride.distanceKm
                    ).toFixed(1)} km`
                  : '—'
              }
            />

            <InfoItem
              label="Duration"
              value={
                ride?.durationMinutes
                  ? `${Math.round(
                      ride.durationMinutes
                    )} min`
                  : '—'
              }
            />

            <InfoItem
              label="Estimated fare"
              value={`₹${fare.toFixed(0)}`}
            />
          </div>
        </section>

        {/* Driver */}

        {driver && (
          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Your driver
              </h2>

              {status ===
                'DRIVER_ARRIVED' && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Arrived
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <UserRound
                  size={23}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">
                  {getDriverName(
                    driver
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Your driver
                </p>
              </div>

              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
                  aria-label="Call driver"
                >
                  <Phone size={17} />
                </a>
              )}
            </div>

            {vehicle && (
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <Car
                    size={20}
                    className="text-gray-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500">
                      Vehicle
                    </p>

                    <p className="mt-0.5 font-semibold text-gray-900">
                      {vehicle.vehicleNumber ||
                        'Vehicle assigned'}
                    </p>
                  </div>
                </div>

                {(vehicle.brand ||
                  vehicle.model ||
                  vehicle.color) && (
                  <p className="mt-3 text-xs text-gray-500">
                    {[
                      vehicle.brand,
                      vehicle.model,
                      vehicle.color,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* OTP */}

        {status ===
          'DRIVER_ARRIVED' && (
          <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={22}
                className="mt-0.5 text-blue-600"
              />

              <div>
                <h2 className="font-semibold text-blue-900">
                  Ride OTP
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  Share this OTP with your driver
                  only when you are ready to start
                  the ride.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-200 bg-white px-4 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Your OTP
              </p>

              {rideOtp ? (
                <p className="mt-2 text-3xl font-bold tracking-[0.35em] text-gray-900">
                  {rideOtp}
                </p>
              ) : (
                <div className="mt-3">
                  <p className="text-lg font-semibold tracking-wider text-gray-400">
                    ••••
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    OTP is unavailable in this session.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Completed */}

        {status ===
          'COMPLETED' && (
          <section className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2
                size={23}
                className="text-green-600"
              />

              <div>
                <h2 className="font-semibold text-green-900">
                  Ride completed
                </h2>

                <p className="mt-1 text-sm text-green-700">
                  Thank you for travelling with
                  SmartCity.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-green-200 pt-4">
              <span className="text-sm text-green-800">
                Final fare
              </span>

              <span className="text-xl font-bold text-green-900">
                ₹
                {Number(
                  ride?.finalFare ??
                    ride?.estimatedFare ??
                    0
                ).toFixed(0)}
              </span>
            </div>
          </section>
        )}

        {/* Cancel */}

        {canCancel && (
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <XCircle size={17} />
            )}

            {cancelling
              ? 'Cancelling...'
              : 'Cancel ride'}
          </button>
        )}

        {/* Terminal */}

        {isTerminal && (
          <button
            type="button"
            onClick={() =>
              router.push('/')
            }
            className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to home
          </button>
        )}
      </div>
    </main>
  )
}

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

function LocationRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  )
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getVehicleLabel(
  vehicleType
) {
  const type = String(
    vehicleType || ''
  ).toLowerCase()

  if (type === 'twowheeler') {
    return 'Two Wheeler'
  }

  if (type === 'auto') {
    return 'Auto'
  }

  if (type === 'car') {
    return 'Car'
  }

  return vehicleType || 'Ride'
}

function getDriverName(
  driver
) {
  if (!driver) {
    return 'Driver'
  }

  const user = driver.user

  const fullName = [
    user?.fname,
    user?.lname,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    fullName ||
    driver.name ||
    'Driver'
  )
}

function getStatusRank(
  status
) {
  const ranks = {
    REQUESTED: 1,
    ACCEPTED: 2,
    DRIVER_ARRIVING: 3,
    DRIVER_ARRIVED: 4,
    OTP_VERIFIED: 5,
    IN_PROGRESS: 5,
    COMPLETED: 6,
  }

  return ranks[status] || 0
}

function isStepActive(
  status,
  step
) {
  if (
    status === 'CANCELLED' ||
    status === 'REJECTED'
  ) {
    return false
  }

  return (
    getStatusRank(status) ===
    getStatusRank(step)
  )
}

function isStepCompleted(
  status,
  step
) {
  if (
    status === 'CANCELLED' ||
    status === 'REJECTED'
  ) {
    return false
  }

  return (
    getStatusRank(status) >
    getStatusRank(step)
  )
}