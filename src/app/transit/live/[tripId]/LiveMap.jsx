'use client'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  useMap,
} from 'react-leaflet'

import L from 'leaflet'

import {
  getLiveAPI,
  getRouteByIdAPI,
  getStopsAPI,
} from '../../../../api/transit.api'

import 'leaflet/dist/leaflet.css'

const defaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],
})

const vehicleIcon = (type = 'bus') =>
  L.divIcon({
    className: '',

    html: `
      <div
        style="
          width:52px;
          height:52px;
          border-radius:50%;
          background:#111827;
          border:4px solid white;
          box-shadow:0 4px 16px rgba(0,0,0,.3);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:26px;
        "
      >
        ${
          type === 'train'
            ? '🚆'
            : '🚌'
        }
      </div>
    `,

    iconSize: [52, 52],

    iconAnchor: [26, 26],

    popupAnchor: [0, -28],
  })

function normalizePoint(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null
  }

  return [
    latitude,
    longitude,
  ]
}

function MapController({ point }) {
  const map = useMap()

  useEffect(() => {
    if (!point) return

    map.flyTo(
      point,
      Math.max(map.getZoom(), 13),
      {
        duration: 0.8,
      }
    )
  }, [map, point])

  return null
}

export default function LiveMap({
  tripId,
}) {
  const [live, setLive] =
    useState(null)

  const [route, setRoute] =
    useState(null)

  const [stops, setStops] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  // ======================================================
  // LOAD DATA
  // ======================================================

  useEffect(() => {
    if (!tripId) return

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError('')

        /*
         * First get live tracking.
         */
        const liveResponse =
          await getLiveAPI(tripId)

        const liveData =
          liveResponse?.data?.data ??
          liveResponse?.data ??
          null

        if (cancelled) return

        setLive(liveData)

        /*
         * Live response currently does not
         * contain route information.
         *
         * Therefore use the routeId from
         * the live/trip response if present.
         */
        const routeId =
          liveData?.trip?.routeId ||
          liveData?.routeId

        if (!routeId) {
          return
        }

        const [
          routeResponse,
          stopsResponse,
        ] = await Promise.all([
          getRouteByIdAPI(routeId),
          getStopsAPI(routeId),
        ])

        if (cancelled) return

        setRoute(
          routeResponse?.data?.data ??
          routeResponse?.data ??
          null
        )

        setStops(
          stopsResponse?.data?.data ??
          stopsResponse?.data ??
          []
        )
      } catch (err) {
        if (cancelled) return

        console.error(
          'Live location error:',
          err
        )

        setError(
          err?.response?.data?.message ||
            'Live location is unavailable'
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [tripId])

  // ======================================================
  // LIVE POSITION
  // ======================================================

  const vehiclePoint =
    useMemo(() => {
      if (!live) return null

      return normalizePoint(
        live.currentLat,
        live.currentLng
      )
    }, [live])

  // ======================================================
  // ROUTE STOPS
  // ======================================================

  const routePoints =
    useMemo(() => {
      return stops
        .map((stop) =>
          normalizePoint(
            stop.lat,
            stop.lng
          )
        )
        .filter(Boolean)
    }, [stops])

  const center =
    vehiclePoint ||
    routePoints[0] ||
    [19.9975, 73.7898]

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white px-5 py-4 text-sm shadow">
          Loading live location...
        </div>
      </div>
    )
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white px-6 py-5 text-center shadow">

          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Trip: {tripId}
          </p>

        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">

<MapContainer
  center={center}
  zoom={13}
  scrollWheelZoom
  zoomControl={false}
  className="h-full w-full"
>
  <ZoomControl position="topright" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          point={vehiclePoint}
        />

        {/* ================================================
            ROUTE
        ================================================ */}

        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#111827',
              weight: 5,
              opacity: 0.75,
            }}
          />
        )}

        {/* ================================================
            STOPS
        ================================================ */}

        {stops.map((stop) => {
          const point =
            normalizePoint(
              stop.lat,
              stop.lng
            )

          if (!point) return null

          return (
            <Marker
              key={stop.id}
              position={point}
              icon={defaultIcon}
            >
              <Popup>
                <div className="min-w-[150px]">

                  <p className="font-semibold">
                    {stop.stopName}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Stop {stop.stopOrder}
                  </p>

                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* ================================================
            VEHICLE
        ================================================ */}

        {vehiclePoint && (
          <Marker
            position={vehiclePoint}
            icon={vehicleIcon(
              route?.transitType
            )}
          >
            <Popup>

              <div className="min-w-[200px]">

                <p className="font-semibold">
                  {live?.trip?.vehicleNumber ||
                    live?.vehicleNumber ||
                    ' '}
                </p>

                <span className="
                  mt-1
                  inline-block
                  rounded-full
                  bg-green-100
                  px-2
                  py-0.5
                  text-[10px]
                  font-semibold
                  text-green-700
                ">
                  LIVE
                </span>

              </div>

            </Popup>
          </Marker>
        )}

      </MapContainer>

      {/* ==================================================
          INFO PANEL
      ================================================== */}

      <div
        className="
          absolute
          right-5
          bottom-5
          z-[1000]
          w-[300px]
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-lg
        "
      >

        <div className="flex items-start justify-between gap-3">

          <div>


            <h1 className="mt-1 text-lg font-semibold text-gray-900">
              {live?.trip?.vehicleNumber ||
                live?.vehicleNumber ||
                'Vehicle'}
            </h1>

          </div>

          <span
            className="
              rounded-full
              bg-green-100
              px-2.5
              py-1
              text-[10px]
              font-semibold
              text-green-700
            "
          >
            LIVE
          </span>

        </div>

        {/* Route */}

        {(route?.routeName ||
          route?.routeNumber) && (
          <div className="mt-4 border-t border-gray-100 pt-4">

            <p className="text-sm font-medium text-gray-900">
              {route.routeName}
            </p>

            {route.routeNumber && (
              <p className="mt-0.5 text-xs text-gray-500">
                Route {route.routeNumber}
              </p>
            )}

          </div>
        )}

        {/* Current stop */}

        {live?.currentStop && (
          <div className="mt-4">

            <p className="text-xs text-gray-400">
              Current stop
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {live.currentStop.stopName}
            </p>

          </div>
        )}

        {/* Next stop */}

        {live?.nextStop && (
          <div className="mt-3">

            <p className="text-xs text-gray-400">
              Next stop
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {live.nextStop.stopName}
            </p>

          </div>
        )}

        {/* Speed */}

        {live?.speedKmph != null && (
          <div className="mt-3 flex justify-between text-sm">

            <span className="text-gray-500">
              Speed
            </span>

            <span className="font-medium text-gray-900">
              {live.speedKmph} km/h
            </span>

          </div>
        )}

        {/* Delay */}

        {live?.delayMinutes != null && (
          <div className="mt-2 flex justify-between text-sm">

            <span className="text-gray-500">
              Delay
            </span>

            <span className="font-medium text-gray-900">
              {live.delayMinutes} min
            </span>

          </div>
        )}

        {/* Updated */}

        {live?.updatedAt && (
          <p className="mt-4 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
            Last updated:{' '}
            {new Date(
              live.updatedAt
            ).toLocaleTimeString()}
          </p>
        )}

      </div>

    </div>
  )
}