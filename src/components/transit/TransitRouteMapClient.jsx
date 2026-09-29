'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import dynamic from 'next/dynamic'

import {
  BusFront,
  ChevronRight,
  Clock3,
  MapPin,
  TrainFront,
  Users,
} from 'lucide-react'

import {
  getRouteLiveVehiclesAPI,
} from '../../api/transit.api'

/* ============================================================
   LOAD THE COMPLETE LEAFLET MAP AS ONE CLIENT COMPONENT
   ============================================================ */

const TransitRouteMapLeaflet = dynamic(
  () =>
    import('./TransitRouteMapLeaflet'),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-full min-h-[360px] items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading map...
        </p>
      </div>
    ),
  }
)

export default function TransitRouteMapClient({
  routeId,
  transitType,
  date,
  tripId,
  trip,
  onSelectVehicle,
}) {
  const [data, setData] = useState(null)

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  /* ============================================================
     LOAD ROUTE + LIVE VEHICLES
     ============================================================ */

  useEffect(() => {
    if (!routeId) {
      setLoading(false)
      return
    }

    let cancelled = false

    let intervalId = null

    const load = async (
      showLoading = false
    ) => {
      try {
        if (showLoading) {
          setLoading(true)
        }

        const response =
          await getRouteLiveVehiclesAPI(
            routeId,
            date
          )

        if (cancelled) {
          return
        }

        const result =
          response?.data?.data ??
          response?.data ??
          null

        setData(result)

        setError('')

        /*
         * Select the first live vehicle.
         */
        if (
          !selectedVehicleId &&
          result?.vehicles?.length
        ) {
          const firstLive =
            result.vehicles.find(
              (vehicle) =>
                vehicle?.liveTracking
            )

          if (firstLive) {
            setSelectedVehicleId(
              firstLive.id
            )
          }
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        console.error(
          'Route live error:',
          err
        )

        setError(
          err?.response?.data?.message ||
            'Unable to load transit route'
        )
      } finally {
        if (
          !cancelled &&
          showLoading
        ) {
          setLoading(false)
        }
      }
    }

    load(true)

    intervalId =
      setInterval(() => {
        load(false)
      }, 10000)

    return () => {
      cancelled = true

      if (intervalId) {
        clearInterval(
          intervalId
        )
      }
    }
  }, [
    routeId,
    date,
    selectedVehicleId,
  ])

  /* ============================================================
     DATA
     ============================================================ */

  const route =
    data?.route || null

  const stops = useMemo(
    () =>
      Array.isArray(data?.stops)
        ? [...data.stops].sort(
            (a, b) =>
              Number(
                a.stopOrder ?? 0
              ) -
              Number(
                b.stopOrder ?? 0
              )
          )
        : [],
    [data]
  )

  const vehicles =
    data?.vehicles || []

  const liveVehicles =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) => {
            const live =
              vehicle?.liveTracking

            return (
              live &&
              Number.isFinite(
                Number(
                  live.currentLat
                )
              ) &&
              Number.isFinite(
                Number(
                  live.currentLng
                )
              )
            )
          }
        ),
      [vehicles]
    )

  const selectedVehicle =
    useMemo(() => {
      if (
        !liveVehicles.length
      ) {
        return null
      }

      return (
        liveVehicles.find(
          (vehicle) =>
            String(
              vehicle.id
            ) ===
            String(
              selectedVehicleId
            )
        ) ||
        liveVehicles[0]
      )
    }, [
      liveVehicles,
      selectedVehicleId,
    ])

  /* ============================================================
     TRANSIT TYPE
     ============================================================ */

  const type =
    transitType ||
    route?.transitType ||
    trip?.transitType ||
    'bus'

  const isTrain =
    String(type).toLowerCase() ===
    'train'

  const VehicleIcon =
    isTrain
      ? TrainFront
      : BusFront

  /* ============================================================
     SELECTED TRIP
     ============================================================ */

  const selectedTrip =
    trip ||
    vehicles.find(
      (vehicle) =>
        String(
          vehicle?.trip?.id
        ) ===
        String(tripId)
    )?.trip ||
    null

  const departureTime =
    selectedTrip?.departureTime ||
    null

  const arrivalTime =
    selectedTrip?.arrivalTime ||
    null

  const durationMinutes =
    calculateScheduledDuration(
      departureTime,
      arrivalTime
    )

  const availableSeats =
    selectedTrip?.availableSeats ??
    null

  /* ============================================================
     MAP COORDINATES
     ============================================================ */

  const stopCoordinates =
    useMemo(
      () =>
        stops
          .map((stop) => ({
            ...stop,
            lat: Number(
              stop.lat
            ),
            lng: Number(
              stop.lng
            ),
          }))
          .filter(
            (stop) =>
              Number.isFinite(
                stop.lat
              ) &&
              Number.isFinite(
                stop.lng
              )
          ),
      [stops]
    )

  const routeCenter =
    stopCoordinates.length > 0
      ? [
          stopCoordinates[0]
            .lat,
          stopCoordinates[0]
            .lng,
        ]
      : [
          Number(
            route?.originLat
          ) || 19.9975,
          Number(
            route?.originLng
          ) || 73.7898,
        ]

  /* ============================================================
     CURRENT / NEXT STOP
     ============================================================ */

  const currentStopId =
    selectedVehicle
      ?.liveTracking
      ?.currentStop?.id

  const nextStopId =
    selectedVehicle
      ?.liveTracking
      ?.nextStop?.id

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Loading transit route...
          </p>
        </div>
      </div>
    )
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">

          <p className="text-sm font-semibold text-red-600">
            {error}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Route information
            could not be loaded.
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-4">

        <div className="flex items-center justify-between gap-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <VehicleIcon
                size={20}
                className="text-gray-700"
              />
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-base font-semibold text-gray-900">
                {route?.routeName ||
                  'Transit route'}
              </h2>

              {route?.routeNumber && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Route{' '}
                  {route.routeNumber}
                </p>
              )}

            </div>

          </div>

          <div className="shrink-0 rounded-full bg-green-50 px-3 py-1.5">
            <span className="text-xs font-semibold text-green-700">
              {liveVehicles.length}{' '}
              live
            </span>
          </div>

        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">

          <span className="truncate">
            {route?.origin ||
              stops[0]?.stopName ||
              'Origin'}
          </span>

          <ChevronRight
            size={15}
            className="shrink-0 text-gray-400"
          />

          <span className="truncate">
            {route?.destination ||
              stops[
                stops.length - 1
              ]?.stopName ||
              'Destination'}
          </span>

        </div>

        {/* ==================================================
            SCHEDULE
        ================================================== */}

        {(departureTime ||
          arrivalTime) && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">

            <Clock3
              size={16}
              className="shrink-0 text-gray-500"
            />

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Departure
              </p>

              <p className="text-sm font-semibold text-gray-900">
                {formatTime(
                  departureTime
                )}
              </p>
            </div>

            <div className="flex flex-1 items-center gap-2">

              <div className="h-px flex-1 bg-gray-300" />

              {durationMinutes !=
                null && (
                <span className="whitespace-nowrap text-[11px] text-gray-500">
                  {formatDuration(
                    durationMinutes
                  )}
                </span>
              )}

              <div className="h-px flex-1 bg-gray-300" />

            </div>

            <div className="text-right">

              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Arrival
              </p>

              <p className="text-sm font-semibold text-gray-900">
                {formatTime(
                  arrivalTime
                )}
              </p>

            </div>

            {availableSeats !=
              null && (
              <div className="ml-2 border-l border-gray-200 pl-4">

                <div className="flex items-center gap-1">

                  <Users
                    size={14}
                    className="text-gray-400"
                  />

                  <span className="text-xs font-medium text-gray-700">
                    {availableSeats}
                  </span>

                </div>

                <p className="text-[10px] text-gray-400">
                  seats
                </p>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          MAP
      ====================================================== */}

      <div className="relative min-h-[360px] flex-1">

        {stopCoordinates.length >
        0 ? (
          <TransitRouteMapLeaflet
            routeCenter={
              routeCenter
            }
            stopCoordinates={
              stopCoordinates
            }
            currentStopId={
              currentStopId
            }
            nextStopId={
              nextStopId
            }
            liveVehicles={
              liveVehicles
            }
            selectedVehicle={
              selectedVehicle
            }
            isTrain={isTrain}
            onSelectVehicle={(
              vehicle
            ) => {
              setSelectedVehicleId(
                vehicle.id
              )

              onSelectVehicle?.(
                vehicle
              )
            }}
          />
        ) : (
          <div className="flex h-full min-h-[360px] items-center justify-center bg-gray-50">

            <div className="text-center">

              <MapPin
                size={28}
                className="mx-auto text-gray-400"
              />

              <p className="mt-2 text-sm font-medium text-gray-700">
                No stop coordinates
                available
              </p>

              <p className="mt-1 text-xs text-gray-500">
                The transit route
                has no mapped
                stops yet.
              </p>

            </div>

          </div>
        )}

  

      

      </div>

      {/* ======================================================
          SELECTED LIVE VEHICLE
      ====================================================== */}

      {selectedVehicle && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Live now
                </p>

              </div>

              <h3 className="mt-1 text-base font-semibold text-gray-900">
                {selectedVehicle.vehicleNumber ||
                  'Transit vehicle'}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {selectedVehicle.vehicleType ||
                  (isTrain
                    ? 'Train'
                    : 'Bus')}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                onSelectVehicle?.(
                  selectedVehicle
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
            >
              Live details
            </button>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-gray-50 p-3">

              <div className="flex items-center gap-2">

                <MapPin
                  size={15}
                  className="text-gray-500"
                />

                <p className="text-[11px] font-medium text-gray-400">
                  CURRENT
                </p>

              </div>

              <p className="mt-2 text-sm font-semibold text-gray-900">
                {selectedVehicle
                  .liveTracking
                  ?.currentStop
                  ?.stopName ||
                  'In transit'}
              </p>

            </div>

            <div className="rounded-xl bg-gray-50 p-3">

              <div className="flex items-center gap-2">

                <ChevronRight
                  size={15}
                  className="text-gray-500"
                />

                <p className="text-[11px] font-medium text-gray-400">
                  NEXT
                </p>

              </div>

              <p className="mt-2 text-sm font-semibold text-gray-900">
                {selectedVehicle
                  .liveTracking
                  ?.nextStop
                  ?.stopName ||
                  'Destination'}
              </p>

            </div>

          </div>

          <div className="mt-3 flex flex-wrap gap-4">

            {selectedVehicle
              .liveTracking
              ?.speedKmph !=
              null && (
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-900">
                  {
                    selectedVehicle
                      .liveTracking
                      .speedKmph
                  }{' '}
                  km/h
                </span>
              </div>
            )}

            {selectedVehicle
              .liveTracking
              ?.delayMinutes !=
              null && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">

                <Clock3
                  size={13}
                />

                <span>
                  {
                    selectedVehicle
                      .liveTracking
                      .delayMinutes
                  }{' '}
                  min delay
                </span>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          STOPS
      ====================================================== */}

      {stops.length > 0 && (
        <div className="max-h-56 shrink-0 overflow-y-auto border-t border-gray-200 bg-gray-50 px-5 py-4">

          <div className="mb-3">

            <h3 className="text-sm font-semibold text-gray-900">
              Route stops
            </h3>

            <p className="mt-0.5 text-xs text-gray-500">
              {stops.length} stops
            </p>

          </div>

          <div className="space-y-2">

            {stops.map(
              (stop, index) => {
                const isCurrent =
                  String(
                    stop.id
                  ) ===
                  String(
                    currentStopId
                  )

                const isNext =
                  String(
                    stop.id
                  ) ===
                  String(
                    nextStopId
                  )

                return (
                  <div
                    key={
                      stop.id ||
                      `stop-${index}`
                    }
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      border
                      px-3
                      py-2.5
                      ${
                        isCurrent
                          ? 'border-gray-900 bg-white'
                          : 'border-gray-200 bg-white'
                      }
                    `}
                  >

                    <div
                      className={`
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-[10px]
                        font-semibold
                        ${
                          isCurrent
                            ? 'bg-gray-900 text-white'
                            : isNext
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500'
                        }
                      `}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`
                          truncate
                          text-xs
                          ${
                            isCurrent
                              ? 'font-bold text-gray-900'
                              : 'font-medium text-gray-700'
                          }
                        `}
                      >
                        {stop.stopName ||
                          `Stop ${index + 1}`}
                      </p>

                      {(stop.arrivalTime ||
                        stop.departureTime) && (
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {stop.departureTime
                            ? formatTime(
                                stop.departureTime
                              )
                            : formatTime(
                                stop.arrivalTime
                              )}
                        </p>
                      )}

                    </div>

                    {isCurrent && (
                      <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-semibold text-green-700">
                        CURRENT
                      </span>
                    )}

                    {isNext && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">
                        NEXT
                      </span>
                    )}

                  </div>
                )
              }
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          LAST UPDATED
      ====================================================== */}

      {selectedVehicle
        ?.liveTracking
        ?.updatedAt && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-2.5">

          <div className="flex items-center gap-2 text-[11px] text-gray-400">

            <Clock3 size={12} />

            <span>
              Last updated{' '}
              {new Date(
                selectedVehicle
                  .liveTracking
                  .updatedAt
              ).toLocaleTimeString()}
            </span>

            <span className="ml-auto">
              Updates every 10 seconds
            </span>

          </div>

        </div>
      )}

    </div>
  )
}

/* ============================================================
   HELPERS
   ============================================================ */

function timeToMinutes(value) {
  if (!value) {
    return null
  }

  const text =
    String(value).trim()

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    )

  if (!match) {
    return null
  }

  const hours =
    Number(match[1])

  const minutes =
    Number(match[2])

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return (
    hours * 60 +
    minutes
  )
}

function calculateScheduledDuration(
  departureTime,
  arrivalTime
) {
  const departure =
    timeToMinutes(
      departureTime
    )

  const arrival =
    timeToMinutes(
      arrivalTime
    )

  if (
    departure == null ||
    arrival == null
  ) {
    return null
  }

  let duration =
    arrival - departure

  if (duration < 0) {
    duration += 24 * 60
  }

  return duration
}

function formatTime(value) {
  if (!value) {
    return '--'
  }

  const text =
    String(value).trim()

  const match =
    text.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    )

  if (!match) {
    const parsed =
      new Date(value)

    if (
      !Number.isNaN(
        parsed.getTime()
      )
    ) {
      return parsed.toLocaleTimeString(
        'en-IN',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      )
    }

    return text
  }

  const hours =
    Number(match[1])

  const minutes =
    Number(match[2])

  const period =
    hours >= 12
      ? 'PM'
      : 'AM'

  const displayHour =
    hours % 12 || 12

  return `${displayHour}:${String(
    minutes
  ).padStart(2, '0')} ${period}`
}

function formatDuration(minutes) {
  const value =
    Number(minutes)

  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return '--'
  }

  const rounded =
    Math.round(value)

  if (rounded < 60) {
    return `${rounded} min`
  }

  const hours =
    Math.floor(
      rounded / 60
    )

  const remaining =
    rounded % 60

  if (remaining === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remaining}m`
}