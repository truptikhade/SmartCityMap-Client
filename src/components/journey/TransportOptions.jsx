'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ArrowRight,
  BusFront,
  Car,
  Clock3,
  IndianRupee,
  Map,
  MapPin,
  Milestone,
  TrainFront,
  Users,
} from 'lucide-react'

const MAX_ROAD_ROUTES = 3

export default function TransportOptions({ journey, onBook, onViewMap }) {
  const selectedTransport = useSelector(
    (state) => state.map.selectedTransport
  )

  const [roadRoutes, setRoadRoutes] = useState([])
  const [roadLoading, setRoadLoading] = useState(false)

  useEffect(() => {
    if (!journey) {
      setRoadRoutes([])
      return
    }

    const fromLat = Number(
      journey.from?.lat ??
        journey.from?.latitude ??
        journey.fromLat
    )
    const fromLng = Number(
      journey.from?.lng ??
        journey.from?.longitude ??
        journey.fromLng
    )
    const toLat = Number(
      journey.to?.lat ??
        journey.to?.latitude ??
        journey.toLat
    )
    const toLng = Number(
      journey.to?.lng ??
        journey.to?.longitude ??
        journey.toLng
    )

    if (
      !Number.isFinite(fromLat) ||
      !Number.isFinite(fromLng) ||
      !Number.isFinite(toLat) ||
      !Number.isFinite(toLng)
    ) {
      setRoadRoutes([])
      return
    }

    let cancelled = false

    const loadRoutes = async () => {
      try {
        setRoadLoading(true)

        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromLng},${fromLat};${toLng},${toLat}` +
          `?overview=full&geometries=geojson&alternatives=3`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Road routing failed')
        }

        const data = await response.json()
        if (
          !Array.isArray(data?.routes) ||
          data.routes.length === 0
        ) {
          throw new Error('No road route found')
        }

        const routes = [...data.routes]
          .sort(
            (a, b) =>
              Number(a.distance) - Number(b.distance)
          )
          .slice(0, MAX_ROAD_ROUTES)
          .map((route, index) => ({
            id: `road-route-${index}`,
            routeNumber: index + 1,
            label:
              index === 0
                ? 'Shortest route'
                : `Alternative ${index}`,
            distanceKm:
              Number(route.distance || 0) / 1000,
            durationMinutes:
              Number(route.duration || 0) / 60,
            geometry: route.geometry || null,
          }))

        if (!cancelled) {
          setRoadRoutes(routes)
        }
      } catch (error) {
        console.error('Road routes error:', error)
        if (cancelled) return

        const fallbackDistance = Number(
          journey.distanceKm || 0
        )
        if (fallbackDistance > 0) {
          setRoadRoutes([
            {
              id: 'road-route-0',
              routeNumber: 1,
              label: 'Estimated route',
              distanceKm: fallbackDistance,
              durationMinutes:
                estimateRoadDuration(fallbackDistance),
              geometry: null,
            },
          ])
        } else {
          setRoadRoutes([])
        }
      } finally {
        if (!cancelled) {
          setRoadLoading(false)
        }
      }
    }

    loadRoutes()

    return () => {
      cancelled = true
    }
  }, [journey])

  /*
   * The map stores the selected road route in Redux.
   * Map click -> selectedTransport.roadRoute -> TransportOptions -> Book Ride
   */
  const selectedRoadRoute = useMemo(() => {
    if (!journey || !roadRoutes.length) {
      return null
    }

    const selectedType = String(
      selectedTransport?.transportType ||
        selectedTransport?.transitType ||
        ''
    ).toLowerCase()

    const isRoadSelection =
      selectedType === 'car' ||
      selectedType === 'twowheeler' ||
      selectedType === 'auto'

    if (isRoadSelection && selectedTransport?.roadRoute) {
      const routeId =
        selectedTransport.roadRouteId ||
        selectedTransport.roadRoute.id

      const matchingRoute = roadRoutes.find(
        (route) => String(route.id) === String(routeId)
      )

      if (matchingRoute) {
        return matchingRoute
      }
      return selectedTransport.roadRoute
    }

    return roadRoutes[0]
  }, [journey, roadRoutes, selectedTransport])

  const options = useMemo(
    () => normalizeOptions(journey, roadRoutes),
    [journey, roadRoutes]
  )

  if (!journey) {
    return null
  }

  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold text-gray-900">
          No travel options found
        </div>
        <p className="mt-1 text-sm text-gray-500">
          No route could be found for this journey.
        </p>
      </div>
    )
  }

  const displayDistance =
    selectedRoadRoute?.distanceKm ||
    roadRoutes[0]?.distanceKm ||
    journey.distanceKm

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          Travel options
        </h2>
        <h3>Select route from map</h3>
        {displayDistance && (
          <p className="mt-1 text-sm text-gray-500">
            {Number(displayDistance).toFixed(2)} km from{' '}
            {shortName(journey.from?.name || journey.from)}{' '}
            to{' '}
            {shortName(journey.to?.name || journey.to)}
          </p>
        )}
        {roadRoutes.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {roadRoutes.length} road route
            {roadRoutes.length !== 1 ? 's' : ''} available on map
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {options.map((option, index) => (
          <TransportCard
            key={
              option.transportType === 'car' ||
              option.transportType === 'twoWheeler' ||
              option.transportType === 'auto'
                ? option.transportType
                : `${option.transportType}-${option.routeId || index}-${index}`
            }
            option={option}
            journey={journey}
            onBook={onBook}
            onViewMap={onViewMap}
            roadLoading={roadLoading}
            roadRoutes={roadRoutes}
            selectedRoadRoute={selectedRoadRoute}
          />
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   NORMALIZE OPTIONS
   ============================================================ */
function normalizeOptions(journey, roadRoutes) {
  const result = []
  const backendOptions =
    journey?.options ||
    journey?.journeyOptions ||
    journey?.routes ||
    []

  /*
   * BUS / TRAIN
   */
  if (Array.isArray(backendOptions)) {
    backendOptions.forEach((option) => {
      const type = normalizeType(
        option.transitType ||
          option.transportType ||
          option.type ||
          option.route?.transitType
      )

      if (type !== 'bus' && type !== 'train') {
        return
      }

      const trip = option.trip || null

      const departureTime =
        option.departureTime ??
        trip?.departureTime ??
        null

      const arrivalTime =
        option.arrivalTime ??
        trip?.arrivalTime ??
        null

      const scheduledDuration =
        option.durationMinutes ??
        calculateScheduledDuration(departureTime, arrivalTime)

      result.push({
        ...option,
        transportType: type,
        routeId: option.routeId || option.route?.id || null,
        route: option.route || null,
        tripId: option.tripId || trip?.id || null,
        trip,
        bookable: Boolean(option.tripId || trip?.id),
        fare:
          option.fare ??
          option.estimatedFare ??
          option.baseFare ??
          option.route?.baseFare ??
          0,
        distanceKm:
          option.distanceKm ??
          journey.distanceKm ??
          0,
        durationMinutes:
          scheduledDuration ??
          estimateDuration(type, journey.distanceKm),
        departureTime,
        arrivalTime,
        availableSeats:
          option.availableSeats ??
          trip?.availableSeats ??
          null,
        totalSeats:
          option.totalSeats ??
          trip?.totalSeats ??
          null,
        vehicleNumber:
          option.vehicleNumber ??
          trip?.vehicleNumber ??
          null,
        vehicleType:
          option.vehicleType ??
          trip?.vehicleType ??
          null,
        driverName:
          option.driverName ??
          trip?.driverName ??
          null,
        stops:
          option.stops ||
          option.route?.stops ||
          [],
      })
    })
  }

  /*
   * ROAD TRANSPORT
   */
  if (roadRoutes.length > 0) {
    result.push({
      transportType: 'car',
      label: 'Car',
      roadRoutes,
      bookable: true,
    })
    result.push({
      transportType: 'twoWheeler',
      label: 'Two Wheeler',
      roadRoutes,
      bookable: true,
    })
    result.push({
      transportType: 'auto',
      label: 'Auto',
      roadRoutes,
      bookable: true,
    })
  }

  return result.sort((a, b) => {
    if (a.bookable !== b.bookable) {
      return a.bookable ? -1 : 1
    }
    if (a.transportType === 'bus' && b.transportType === 'train') {
      return -1
    }
    return 0
  })
}

/* ============================================================
   TRANSPORT CARD
   ============================================================ */
function TransportCard({
  option,
  journey,
  onBook,
  onViewMap,
  roadLoading,
  roadRoutes,
  selectedRoadRoute,
}) {
  const isTrain = option.transportType === 'train'
  const isBus = option.transportType === 'bus'
  const isPublicTransport = isTrain || isBus
  const isRoadTransport = !isPublicTransport
  const isCar = option.transportType === 'car'
  const isTwoWheeler = option.transportType === 'twoWheeler'

  const route = isRoadTransport
    ? selectedRoadRoute || roadRoutes?.[0] || null
    : null

  const distanceKm = route?.distanceKm ?? 0

  const durationMinutes =
    isRoadTransport && route
      ? getRoadDurationForTransport(route.durationMinutes, option.transportType)
      : Number(option.durationMinutes || 0)

  const fare =
    isRoadTransport && route
      ? calculateRoadFare(distanceKm, option.transportType)
      : Number(option.fare || 0)

  const handleViewMap = () => {
    if (isRoadTransport) return
    onViewMap?.(option)
  }

  const handleBookRoad = () => {
    if (!route) return
    onBook?.({
      ...option,
      transportType: option.transportType,
      vehicleType: option.transportType,
      from: journey.from,
      to: journey.to,
      roadRoute: route,
      roadRouteId: route.id,
      roadRoutes,
      distanceKm: Number(distanceKm),
      durationMinutes: Number(durationMinutes),
      fare: Number(fare),
      estimatedFare: Number(fare),
    })
  }

  const handleBookTransit = () => {
    onBook?.({
      ...option,
      from: journey.from,
      to: journey.to,
      transitType: option.transportType,
      transportType: option.transportType,
      routeId: option.routeId,
      route: option.route,
      tripId: option.tripId,
      trip: option.trip,
      fare: option.fare,
      baseFare: option.baseFare,
      distanceKm: option.distanceKm,
      durationMinutes: option.durationMinutes,
      departureTime: option.departureTime,
      arrivalTime: option.arrivalTime,
      boardingStop: option.boardingStop,
      dropStop: option.dropStop,
      availableSeats: option.availableSeats,
      option,
    })
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        {/* ICON */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {isTrain ? (
            <TrainFront size={22} />
          ) : isBus ? (
            <BusFront size={22} />
          ) : isCar ? (
            <Car size={22} />
          ) : isTwoWheeler ? (
            <Milestone size={22} />
          ) : (
            <Car size={22} />
          )}
        </div>

        {/* MAIN */}
        <div className="min-w-0 flex-1">
          {/* TITLE */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {getTransportLabel(option.transportType)}
              </div>
              {option.routeNumber && (
                <div className="mt-0.5 text-xs text-gray-500">
                  Route {option.routeNumber}
                </div>
              )}
              {option.routeName && (
                <div className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                  {option.routeName}
                </div>
              )}
              {option.vehicleNumber && (
                <div className="mt-0.5 text-xs text-gray-500">
                  Vehicle {option.vehicleNumber}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-0.5 text-base font-semibold text-gray-900">
              <IndianRupee size={15} />
              {Math.round(fare)}
            </div>
          </div>

          {/* ROAD VEHICLE DETAILS */}
          {isRoadTransport ? (
            <div className="mt-3">
              {roadLoading ? (
                <div className="text-xs text-gray-400">Finding route...</div>
              ) : route ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {Number(distanceKm).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 size={13} />
                    {formatDuration(durationMinutes)}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Route unavailable</div>
              )}
            </div>
          ) : (
            <>
              {/* BUS / TRAIN JOURNEY */}
              {isTrain ? (
                <TrainStops option={option} />
              ) : (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                  <MapPin size={15} className="shrink-0 text-gray-400" />
                  <span className="truncate">
                    {option.origin ||
                      journey.from?.name ||
                      shortName(journey.from)}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-gray-400" />
                  <span className="truncate">
                    {option.destination ||
                      journey.to?.name ||
                      shortName(journey.to)}
                  </span>
                </div>
              )}

              {/* ACTUAL SCHEDULE */}
              {(option.departureTime || option.arrivalTime) && (
                <div className="mt-4 flex items-center gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-900">
                      {formatTime(option.departureTime)}
                    </div>
                    <div className="text-[11px] text-gray-400">Departure</div>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-[11px] text-gray-400">
                      {formatDuration(option.durationMinutes)}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-gray-900">
                      {formatTime(option.arrivalTime)}
                    </div>
                    <div className="text-[11px] text-gray-400">Arrival</div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                {option.durationMinutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock3 size={14} />
                    {formatDuration(option.durationMinutes)}
                  </span>
                )}
                {option.distanceKm > 0 && (
                  <span>{Number(option.distanceKm).toFixed(1)} km</span>
                )}
                {option.availableSeats != null && (
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {option.availableSeats} seats left
                  </span>
                )}
              </div>
            </>
          )}

          {/* ACTIONS */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isPublicTransport && (
              <button
                type="button"
                onClick={handleViewMap}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Map size={14} />
                View route
              </button>
            )}

            {option.bookable &&
              (isRoadTransport ? (
                <button
                  type="button"
                  disabled={roadLoading || !route}
                  onClick={handleBookRoad}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Book
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBookTransit}
                  className="ml-auto flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Book
                  <ArrowRight size={15} />
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   TRAIN / BUS STOPS
   ============================================================ */
function TrainStops({ option }) {
  const stops = Array.isArray(option.stops)
    ? [...option.stops].sort(
        (a, b) =>
          Number(a.stopOrder ?? a.sequence ?? 0) -
          Number(b.stopOrder ?? b.sequence ?? 0)
      )
    : []

  if (stops.length === 0) {
    return (
      <div className="mt-3 text-sm text-gray-600">
        {option.origin || 'Origin'}
        <span className="mx-2 text-gray-400">→</span>
        {option.destination || 'Destination'}
      </div>
    )
  }

  const firstStop = stops[0]
  const lastStop = stops[stops.length - 1]

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
      <MapPin size={15} className="shrink-0 text-gray-400" />
      <span className="truncate">
        {firstStop.stopName || firstStop.name || 'Origin'}
      </span>
      <ArrowRight size={14} className="shrink-0 text-gray-400" />
      <span className="truncate">
        {lastStop.stopName || lastStop.name || 'Destination'}
      </span>
    </div>
  )
}

/* ============================================================
   HELPERS
   ============================================================ */
function normalizeType(type) {
  const value = String(type || '').toLowerCase()
  if (value.includes('train') || value.includes('rail')) {
    return 'train'
  }
  if (value.includes('bus')) {
    return 'bus'
  }
  return value
}

function getTransportLabel(type) {
  switch (type) {
    case 'bus':
      return 'Bus'
    case 'train':
      return 'Train'
    case 'car':
      return 'Car'
    case 'twoWheeler':
      return 'Two Wheeler'
    case 'auto':
      return 'Auto'
    default:
      return type || 'Transport'
  }
}

/* ============================================================
   SCHEDULE HELPERS
   ============================================================ */
function timeToMinutes(value) {
  if (!value) return null
  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

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
  return hours * 60 + minutes
}

function calculateScheduledDuration(departureTime, arrivalTime) {
  const departure = timeToMinutes(departureTime)
  const arrival = timeToMinutes(arrivalTime)

  if (departure == null || arrival == null) return null

  let duration = arrival - departure
  if (duration < 0) {
    duration += 24 * 60
  }
  return duration
}

function formatTime(value) {
  if (!value) return '--'
  const text = String(value).trim()
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

  if (!match) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    }
    return text
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12

  return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
}

function formatDuration(minutes) {
  const value = Number(minutes)
  if (!Number.isFinite(value) || value < 0) return '--'

  const rounded = Math.round(value)
  if (rounded < 60) {
    return `${rounded} min`
  }
  const hours = Math.floor(rounded / 60)
  const remaining = rounded % 60

  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}m`
}

/* ============================================================
   ROAD FARE & ETA ESTIMATIONS
   ============================================================ */
function calculateRoadFare(distanceKm, transportType) {
  const distance = Number(distanceKm || 0)
  switch (transportType) {
    case 'car':
      return Math.round(Math.max(100, distance * 12))
    case 'twoWheeler':
      return Math.round(Math.max(40, distance * 5))
    case 'auto':
      return Math.round(Math.max(80, 30 + distance * 10))
    default:
      return 0
  }
}

function getRoadDurationForTransport(roadDurationMinutes, transportType) {
  const duration = Number(roadDurationMinutes || 0)
  switch (transportType) {
    case 'twoWheeler':
      return duration * 0.9
    case 'auto':
      return duration * 1.05
    case 'car':
    default:
      return duration
  }
}

function estimateDuration(type, distanceKm) {
  const distance = Number(distanceKm || 0)
  if (type === 'train') {
    return Math.round((distance / 45) * 60)
  }
  return Math.round((distance / 30) * 60)
}

function estimateRoadDuration(distanceKm) {
  const distance = Number(distanceKm || 0)
  return Math.round((distance / 40) * 60)
}

/* ============================================================
   LOCATION NAME HELPER
   ============================================================ */
function shortName(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    return value.split(',')[0]
  }
  return (
    value.name?.split(',')[0] ||
    value.display_name?.split(',')[0] ||
    ''
  )
}