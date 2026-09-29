'use client'

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import TransitMapViewController from './TransitMapViewController'

export default function TransitRouteMapLeaflet({
  routeCenter,
  stopCoordinates,
  currentStopId,
  nextStopId,
  liveVehicles,
  selectedVehicle,
  isTrain,
  onSelectVehicle,
}) {
  return (
    <MapContainer
      center={routeCenter}
      zoom={12}
      zoomControl={true}
      scrollWheelZoom={true}
      className="h-full min-h-[360px] w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <TransitMapViewController
        coordinates={stopCoordinates}
      />

      {/* ======================================================
          ROUTE
      ====================================================== */}

      <Polyline
        positions={stopCoordinates.map(
          (stop) => [
            stop.lat,
            stop.lng,
          ]
        )}
        pathOptions={{
          color: '#2563eb',
          weight: 5,
          opacity: 0.85,
        }}
      />

      {/* ======================================================
          STOPS
      ====================================================== */}

      {stopCoordinates.map(
        (stop, index) => {
          const isCurrent =
            String(stop.id) ===
            String(currentStopId)

          const isNext =
            String(stop.id) ===
            String(nextStopId)

          return (
            <CircleMarker
              key={
                stop.id ||
                `stop-${index}`
              }
              center={[
                stop.lat,
                stop.lng,
              ]}
              radius={
                isCurrent
                  ? 8
                  : isNext
                    ? 7
                    : 5
              }
              pathOptions={{
                color:
                  isCurrent
                    ? '#111827'
                    : isNext
                      ? '#2563eb'
                      : '#ffffff',

                weight: 3,

                fillColor:
                  isCurrent
                    ? '#111827'
                    : isNext
                      ? '#2563eb'
                      : '#ffffff',

                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <p className="text-sm font-semibold text-gray-900">
                    {stop.stopName ||
                      `Stop ${index + 1}`}
                  </p>

                  {stop.stopCode && (
                    <p className="mt-1 text-xs text-gray-500">
                      {stop.stopCode}
                    </p>
                  )}

                  {stop.arrivalTime && (
                    <p className="mt-2 text-xs text-gray-600">
                      Arrival:{' '}
                      <span className="font-medium">
                        {formatTime(
                          stop.arrivalTime
                        )}
                      </span>
                    </p>
                  )}

                  {stop.departureTime && (
                    <p className="text-xs text-gray-600">
                      Departure:{' '}
                      <span className="font-medium">
                        {formatTime(
                          stop.departureTime
                        )}
                      </span>
                    </p>
                  )}

                  {isCurrent && (
                    <p className="mt-2 text-[10px] font-semibold text-green-600">
                      CURRENT STOP
                    </p>
                  )}

                  {isNext && (
                    <p className="mt-2 text-[10px] font-semibold text-blue-600">
                      NEXT STOP
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        }
      )}

      {/* ======================================================
          LIVE VEHICLES
      ====================================================== */}

      {liveVehicles.map(
        (vehicle) => {
          const live =
            vehicle.liveTracking

          if (
            !live ||
            !Number.isFinite(
              Number(live.currentLat)
            ) ||
            !Number.isFinite(
              Number(live.currentLng)
            )
          ) {
            return null
          }

          const selected =
            String(vehicle.id) ===
            String(
              selectedVehicle?.id
            )

          return (
            <CircleMarker
              key={`vehicle-${vehicle.id}`}
              center={[
                Number(
                  live.currentLat
                ),
                Number(
                  live.currentLng
                ),
              ]}
              radius={
                selected
                  ? 10
                  : 8
              }
              pathOptions={{
                color: '#ffffff',
                weight: 3,
                fillColor:
                  selected
                    ? '#111827'
                    : '#2563eb',
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => {
                  onSelectVehicle?.(
                    vehicle
                  )
                },
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="text-sm font-semibold text-gray-900">
                    {vehicle.vehicleNumber ||
                      'Vehicle'}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {vehicle.vehicleType ||
                      (isTrain
                        ? 'Train'
                        : 'Bus')}
                  </p>

                  {live.speedKmph !=
                    null && (
                    <p className="mt-2 text-xs text-gray-600">
                      Speed:{' '}
                      <span className="font-medium">
                        {live.speedKmph} km/h
                      </span>
                    </p>
                  )}

                  {live.delayMinutes !=
                    null && (
                    <p className="text-xs text-gray-600">
                      Delay:{' '}
                      <span className="font-medium">
                        {live.delayMinutes} min
                      </span>
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        }
      )}
    </MapContainer>
  )
}

/* ============================================================
   HELPERS
   ============================================================ */

function formatTime(value) {
  if (!value) {
    return '--'
  }

  const text = String(value).trim()

  const match = text.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  )

  if (!match) {
    const parsed = new Date(value)

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

  const hours = Number(match[1])
  const minutes = Number(match[2])

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