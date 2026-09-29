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
  useMap,
} from 'react-leaflet'

import { useDispatch } from 'react-redux'

import {
  setSelectedTransport,
} from '../../store/mapSlice'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

const MAX_ROAD_ROUTES = 3

/* ============================================================
   LEAFLET ICONS
============================================================ */

const defaultIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedPlaceIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
})

/* ============================================================
   SELECTED PLACE CONTROLLER
============================================================ */

function SelectedPlaceController({
  selectedPlace,
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedPlace) {
      return
    }

    const lat = Number(
      selectedPlace.latitude ??
        selectedPlace.lat
    )

    const lng = Number(
      selectedPlace.longitude ??
        selectedPlace.lng ??
        selectedPlace.lon
    )

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return
    }

    map.flyTo(
      [lat, lng],
      15,
      {
        animate: true,
        duration: 1.2,
      }
    )
  }, [
    selectedPlace,
    map,
  ])

  return null
}

/* ============================================================
   ROAD ROUTE CONTROLLER
============================================================ */

function RoadRouteController({
  journey,
  selectedTransport,
  onRoutesChange,
}) {
  const map = useMap()
  const dispatch = useDispatch()

  const [roadRoutes, setRoadRoutes] =
    useState([])

  const selectedRouteId =
    selectedTransport?.roadRouteId ||
    selectedTransport?.roadRoute?.id ||
    null

  useEffect(() => {
    if (!journey) {
      setRoadRoutes([])
      onRoutesChange([])
      return
    }

    const transportType = String(
      selectedTransport?.transportType ||
        selectedTransport?.transitType ||
        ''
    ).toLowerCase()

    /*
     * Bus and train have their own route rendering.
     */
    if (
      transportType === 'bus' ||
      transportType === 'train'
    ) {
      setRoadRoutes([])
      onRoutesChange([])
      return
    }

    /*
     * If the selected transport already contains
     * the complete road route collection, use it.
     */
    if (
      Array.isArray(
        selectedTransport?.roadRoutes
      ) &&
      selectedTransport.roadRoutes.length > 0
    ) {
      setRoadRoutes(
        selectedTransport.roadRoutes
      )

      onRoutesChange(
        selectedTransport.roadRoutes
      )

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
      onRoutesChange([])
      return
    }

    let cancelled = false

    const loadRoutes = async () => {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromLng},${fromLat};${toLng},${toLat}` +
          `?overview=full&geometries=geojson&alternatives=3`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(
            'Road routing failed'
          )
        }

        const data =
          await response.json()

        if (
          !Array.isArray(
            data?.routes
          ) ||
          data.routes.length === 0
        ) {
          throw new Error(
            'No road routes returned'
          )
        }

        const routes = [
          ...data.routes,
        ]
          .sort(
            (a, b) =>
              Number(a.distance) -
              Number(b.distance)
          )
          .slice(
            0,
            MAX_ROAD_ROUTES
          )
          .map(
            (
              route,
              index
            ) => ({
              id: `road-route-${index}`,

              routeNumber:
                index + 1,

              label:
                index === 0
                  ? 'Shortest route'
                  : `Alternative ${index}`,

              distanceKm:
                Number(
                  route.distance || 0
                ) / 1000,

              durationMinutes:
                Number(
                  route.duration || 0
                ) / 60,

              geometry:
                route.geometry ||
                null,
            })
          )

        if (cancelled) {
          return
        }

        setRoadRoutes(routes)
        onRoutesChange(routes)

        /*
         * Fit the map around ALL alternatives.
         */
        const allCoordinates =
          routes.flatMap(
            (route) =>
              getGeometryCoordinates(
                route
              )
          )

        if (allCoordinates.length > 1) {
          const bounds =
            L.latLngBounds(
              allCoordinates
            )

          if (bounds.isValid()) {
            map.fitBounds(
              bounds,
              {
                padding: [
                  70,
                  70,
                ],
              }
            )
          }
        }
      } catch (error) {
        console.error(
          'Road route loading failed:',
          error
        )

        if (cancelled) {
          return
        }

        const fallbackDistance =
          Number(
            journey.distanceKm || 0
          )

        if (
          fallbackDistance > 0
        ) {
          const fallbackRoute = {
            id: 'road-route-0',
            routeNumber: 1,
            label: 'Estimated route',
            distanceKm:
              fallbackDistance,
            durationMinutes:
              estimateRoadDuration(
                fallbackDistance
              ),
            geometry: null,
          }

          setRoadRoutes([
            fallbackRoute,
          ])

          onRoutesChange([
            fallbackRoute,
          ])
        } else {
          setRoadRoutes([])
          onRoutesChange([])
        }
      }
    }

    loadRoutes()

    return () => {
      cancelled = true
    }
  }, [
    journey,
    selectedTransport?.roadRoutes,
    selectedTransport?.transportType,
    onRoutesChange,
    map,
  ])

  /*
   * If Redux has a selected route, make sure
   * the map still displays the selected geometry.
   */
  useEffect(() => {
    if (
      !selectedTransport?.roadRoute ||
      !roadRoutes.length
    ) {
      return
    }

    const selectedRoute =
      roadRoutes.find(
        (route) =>
          String(route.id) ===
          String(selectedRouteId)
      )

    if (!selectedRoute) {
      return
    }

    const coordinates =
      getGeometryCoordinates(
        selectedRoute
      )

    if (coordinates.length < 2) {
      return
    }

    /*
     * Do not refit every time Redux changes.
     * The user may have manually moved the map.
     */
  }, [
    selectedRouteId,
    selectedTransport,
    roadRoutes,
  ])

  const handleRouteClick =
    (route) => {
      if (!route) {
        return
      }

      const distanceKm =
        Number(
          route.distanceKm || 0
        )

      const durationMinutes =
        getRoadDurationForTransport(
          route.durationMinutes,
          'car'
        )

      const fare =
        calculateRoadFare(
          distanceKm,
          'car'
        )

      /*
       * IMPORTANT:
       *
       * Route selection is stored in Redux.
       *
       * TransportOptions reads this same value
       * and uses it when Book is clicked.
       */
      dispatch(
        setSelectedTransport({
          transportType: 'car',
          vehicleType: 'car',

          roadRoute: route,

          roadRouteId:
            route.id,

          roadRoutes:
            roadRoutes,

          distanceKm,

          durationMinutes,

          fare,

          estimatedFare:
            fare,
        })
      )
    }

  const handleMouseOver =
    (event) => {
      event.target.setStyle({
        weight: 7,
        opacity: 0.95,
      })

      event.target.bringToFront()
    }

  const handleMouseOut =
    (event) => {
      const routeId =
        event.target?.options
          ?.routeId

      const isSelected =
        String(routeId) ===
        String(selectedRouteId)

      event.target.setStyle({
        weight: isSelected
          ? 7
          : 4,
        opacity: isSelected
          ? 1
          : 0.65,
      })
    }

  return (
    <>
      {roadRoutes.map(
        (route) => {
          const coordinates =
            getGeometryCoordinates(
              route
            )

          if (
            coordinates.length < 2
          ) {
            return null
          }

          const isSelected =
            String(route.id) ===
            String(selectedRouteId)

          return (
            <Polyline
              key={route.id}
              positions={
                coordinates
              }
              pathOptions={{
                routeId:
                  route.id,

                color: isSelected
                  ? '#2563eb'
                  : '#64748b',

                weight: isSelected
                  ? 7
                  : 4,

                opacity: isSelected
                  ? 1
                  : 0.65,

                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () =>
                  handleRouteClick(
                    route
                  ),

                mouseover:
                  handleMouseOver,

                mouseout:
                  handleMouseOut,
              }}
            />
          )
        }
      )}
    </>
  )
}

/* ============================================================
   TRANSIT ROUTE CONTROLLER
============================================================ */

function TransitRouteController({
  journey,
  selectedTransport,
  onRouteChange,
}) {
  const map = useMap()

  useEffect(() => {
    let cancelled = false

    const loadRoute = async () => {
      if (!journey) {
        onRouteChange([])
        return
      }

      const transportType =
        String(
          selectedTransport?.transportType ||
            selectedTransport?.transitType ||
            ''
        ).toLowerCase()

      if (
        transportType !== 'bus' &&
        transportType !== 'train'
      ) {
        onRouteChange([])
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
        onRouteChange([])
        return
      }

      try {
        const stops = Array.isArray(
          selectedTransport?.stops
        )
          ? [
              ...selectedTransport.stops,
            ].sort(
              (a, b) =>
                Number(
                  a.stopOrder ??
                    a.sequence ??
                    0
                ) -
                Number(
                  b.stopOrder ??
                    b.sequence ??
                    0
                )
            )
          : []

        const stopCoordinates =
          getStopCoordinates(
            stops
          )

        if (
          transportType ===
          'train'
        ) {
          const route =
            removeDuplicateCoordinates([
              [
                fromLat,
                fromLng,
              ],
              ...stopCoordinates,
              [
                toLat,
                toLng,
              ],
            ])

          if (cancelled) {
            return
          }

          onRouteChange(route)
          fitRoute(
            map,
            route
          )

          return
        }

        /*
         * Bus route:
         *
         * start → bus stops → destination
         */
        const waypoints = [
          [
            fromLat,
            fromLng,
          ],
          ...stopCoordinates,
          [
            toLat,
            toLng,
          ],
        ]

        const uniqueWaypoints =
          removeDuplicateCoordinates(
            waypoints
          )

        let route = []

        if (
          uniqueWaypoints.length >=
          2
        ) {
          route =
            await getShortestRoadRoute(
              uniqueWaypoints
            )
        }

        if (
          route.length < 2
        ) {
          route =
            uniqueWaypoints
        }

        if (cancelled) {
          return
        }

        onRouteChange(route)
        fitRoute(
          map,
          route
        )
      } catch (error) {
        console.error(
          'Transit route loading failed:',
          error
        )

        const fallback = [
          [
            fromLat,
            fromLng,
          ],
          [
            toLat,
            toLng,
          ],
        ]

        if (!cancelled) {
          onRouteChange(
            fallback
          )

          fitRoute(
            map,
            fallback
          )
        }
      }
    }

    loadRoute()

    return () => {
      cancelled = true
    }
  }, [
    journey,
    selectedTransport,
    map,
    onRouteChange,
  ])

  return null
}

/* ============================================================
   STOP COORDINATES
============================================================ */

function getStopCoordinates(
  stops
) {
  return stops
    .map((stop) => {
      const lat = Number(
        stop.lat ??
          stop.latitude
      )

      const lng = Number(
        stop.lng ??
          stop.longitude ??
          stop.lon
      )

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return null
      }

      return [
        lat,
        lng,
      ]
    })
    .filter(Boolean)
}

/* ============================================================
   REMOVE DUPLICATES
============================================================ */

function removeDuplicateCoordinates(
  coordinates
) {
  const result = []

  for (
    const coordinate of coordinates
  ) {
    if (
      !Array.isArray(
        coordinate
      ) ||
      coordinate.length !== 2
    ) {
      continue
    }

    const lat = Number(
      coordinate[0]
    )

    const lng = Number(
      coordinate[1]
    )

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      continue
    }

    const exists =
      result.some(
        ([existingLat, existingLng]) =>
          Math.abs(
            existingLat - lat
          ) < 0.00001 &&
          Math.abs(
            existingLng - lng
          ) < 0.00001
      )

    if (!exists) {
      result.push([
        lat,
        lng,
      ])
    }
  }

  return result
}

/* ============================================================
   EXISTING ROAD GEOMETRY
============================================================ */

function getGeometryCoordinates(
  roadRoute
) {
  if (!roadRoute) {
    return []
  }

  const geometry =
    roadRoute.geometry

  if (
    !geometry ||
    !Array.isArray(
      geometry.coordinates
    )
  ) {
    return []
  }

  return geometry.coordinates
    .map(
      (coordinate) => {
        if (
          !Array.isArray(
            coordinate
          ) ||
          coordinate.length < 2
        ) {
          return null
        }

        const lng =
          Number(
            coordinate[0]
          )

        const lat =
          Number(
            coordinate[1]
          )

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          return null
        }

        return [
          lat,
          lng,
        ]
      }
    )
    .filter(Boolean)
}

/* ============================================================
   OSRM FALLBACK ROUTE
============================================================ */

async function getShortestRoadRoute(
  coordinates
) {
  if (
    !Array.isArray(
      coordinates
    ) ||
    coordinates.length < 2
  ) {
    return []
  }

  const coordinateString =
    coordinates
      .map(
        ([lat, lng]) =>
          `${lng},${lat}`
      )
      .join(';')

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    coordinateString +
    `?overview=full&geometries=geojson&alternatives=true`

  const response =
    await fetch(url)

  if (!response.ok) {
    throw new Error(
      `OSRM request failed: ${response.status}`
    )
  }

  const data =
    await response.json()

  if (
    !data.routes?.length
  ) {
    return []
  }

  const shortestRoute =
    [...data.routes].sort(
      (a, b) =>
        Number(a.distance) -
        Number(b.distance)
    )[0]

  if (
    !shortestRoute?.geometry
      ?.coordinates
  ) {
    return []
  }

  return shortestRoute.geometry.coordinates
    .map(
      ([lng, lat]) => [
        Number(lat),
        Number(lng),
      ]
    )
    .filter(
      ([lat, lng]) =>
        Number.isFinite(lat) &&
        Number.isFinite(lng)
    )
}

/* ============================================================
   FIT ROUTE
============================================================ */

function fitRoute(
  map,
  route
) {
  if (
    !route ||
    route.length < 2
  ) {
    return
  }

  const bounds =
    L.latLngBounds(route)

  if (bounds.isValid()) {
    map.fitBounds(
      bounds,
      {
        padding: [
          60,
          60,
        ],
      }
    )
  }
}

/* ============================================================
   ROAD FARE
============================================================ */

function calculateRoadFare(
  distanceKm,
  transportType
) {
  const distance =
    Number(
      distanceKm || 0
    )

  switch (
    transportType
  ) {
    case 'car':
      return Math.round(
        Math.max(
          100,
          distance * 12
        )
      )

    case 'twoWheeler':
      return Math.round(
        Math.max(
          40,
          distance * 5
        )
      )

    case 'auto':
      return Math.round(
        Math.max(
          80,
          30 +
            distance * 10
        )
      )

    default:
      return 0
  }
}

/* ============================================================
   ROAD ETA
============================================================ */

function getRoadDurationForTransport(
  durationMinutes,
  transportType
) {
  const duration =
    Number(
      durationMinutes || 0
    )

  switch (
    transportType
  ) {
    case 'twoWheeler':
      return duration * 0.9

    case 'auto':
      return duration * 1.05

    case 'car':
    default:
      return duration
  }
}

function estimateRoadDuration(
  distanceKm
) {
  const distance =
    Number(
      distanceKm || 0
    )

  return Math.round(
    (distance / 40) * 60
  )
}

/* ============================================================
   MAIN MAP
============================================================ */

export default function JourneyMapClient({
  journey = null,

  initialCenter = [
    18.5204,
    73.8567,
  ],

  selectedPlace = null,

  selectedTransport = null,
}) {
  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState([])

  const [
    roadRoutes,
    setRoadRoutes,
  ] = useState([])

  const safeInitialCenter =
    useMemo(() => {
      if (
        Array.isArray(
          initialCenter
        ) &&
        initialCenter.length === 2
      ) {
        const lat =
          Number(
            initialCenter[0]
          )

        const lng =
          Number(
            initialCenter[1]
          )

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
          return [
            lat,
            lng,
          ]
        }
      }

      return [
        18.5204,
        73.8567,
      ]
    }, [
      initialCenter,
    ])

  const fromPosition =
    journey
      ? [
          Number(
            journey.from?.lat ??
              journey.from?.latitude ??
              journey.fromLat
          ),

          Number(
            journey.from?.lng ??
              journey.from?.longitude ??
              journey.fromLng
          ),
        ]
      : null

  const toPosition =
    journey
      ? [
          Number(
            journey.to?.lat ??
              journey.to?.latitude ??
              journey.toLat
          ),

          Number(
            journey.to?.lng ??
              journey.to?.longitude ??
              journey.toLng
          ),
        ]
      : null

  const selectedPlacePosition =
    selectedPlace
      ? [
          Number(
            selectedPlace.latitude ??
              selectedPlace.lat
          ),

          Number(
            selectedPlace.longitude ??
              selectedPlace.lng ??
              selectedPlace.lon
          ),
        ]
      : null

  const hasValidFrom =
    Array.isArray(
      fromPosition
    ) &&
    Number.isFinite(
      fromPosition[0]
    ) &&
    Number.isFinite(
      fromPosition[1]
    )

  const hasValidTo =
    Array.isArray(
      toPosition
    ) &&
    Number.isFinite(
      toPosition[0]
    ) &&
    Number.isFinite(
      toPosition[1]
    )

  const hasValidSelectedPlace =
    Array.isArray(
      selectedPlacePosition
    ) &&
    Number.isFinite(
      selectedPlacePosition[0]
    ) &&
    Number.isFinite(
      selectedPlacePosition[1]
    )

  const selectedTransportType =
    String(
      selectedTransport?.transportType ||
        selectedTransport?.transitType ||
        ''
    ).toLowerCase()

  const isBus =
    selectedTransportType ===
    'bus'

  const isTrain =
    selectedTransportType ===
    'train'

  const isRoadTransport =
    !isBus &&
    !isTrain

  const selectedRoadRoute =
    selectedTransport?.roadRoute ||
    null

  const selectedRoadRouteId =
    selectedTransport?.roadRouteId ||
    selectedRoadRoute?.id ||
    null

  const selectedRouteDistance =
    selectedRoadRoute?.distanceKm

  const selectedRouteDuration =
    selectedRoadRoute
      ? getRoadDurationForTransport(
          selectedRoadRoute.durationMinutes,
          selectedTransportType ||
            'car'
        )
      : null

  const selectedCarFare =
    selectedRoadRoute
      ? calculateRoadFare(
          selectedRoadRoute.distanceKm,
          'car'
        )
      : null

  const selectedTwoWheelerFare =
    selectedRoadRoute
      ? calculateRoadFare(
          selectedRoadRoute.distanceKm,
          'twoWheeler'
        )
      : null

  const selectedAutoFare =
    selectedRoadRoute
      ? calculateRoadFare(
          selectedRoadRoute.distanceKm,
          'auto'
        )
      : null

  return (
    <div className="relative h-full min-h-[500px] w-full">
      <MapContainer
        center={
          safeInitialCenter
        }
        zoom={11}
        scrollWheelZoom
        className="h-full min-h-[500px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SelectedPlaceController
          selectedPlace={
            selectedPlace
          }
        />

        {isRoadTransport ? (
          <RoadRouteController
            journey={journey}
            selectedTransport={
              selectedTransport
            }
            onRoutesChange={
              setRoadRoutes
            }
          />
        ) : (
          <TransitRouteController
            journey={journey}
            selectedTransport={
              selectedTransport
            }
            onRouteChange={
              setRouteCoordinates
            }
          />
        )}

        {/* START */}

        {hasValidFrom && (
          <Marker
            position={
              fromPosition
            }
            icon={
              defaultIcon
            }
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-xs font-medium text-green-600">
                  START
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {journey?.from?.name ||
                    journey?.from
                      ?.display_name ||
                    'Starting point'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* DESTINATION */}

        {hasValidTo && (
          <Marker
            position={
              toPosition
            }
            icon={
              defaultIcon
            }
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-xs font-medium text-red-600">
                  DESTINATION
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {journey?.to?.name ||
                    journey?.to
                      ?.display_name ||
                    'Destination'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* BUS STOPS */}

        {isBus &&
          Array.isArray(
            selectedTransport?.stops
          ) &&
          selectedTransport.stops.map(
            (
              stop,
              index
            ) => {
              const lat =
                Number(
                  stop.lat ??
                    stop.latitude
                )

              const lng =
                Number(
                  stop.lng ??
                    stop.longitude ??
                    stop.lon
                )

              if (
                !Number.isFinite(
                  lat
                ) ||
                !Number.isFinite(
                  lng
                )
              ) {
                return null
              }

              return (
                <Marker
                  key={
                    stop.id ||
                    `${lat}-${lng}-${index}`
                  }
                  position={[
                    lat,
                    lng,
                  ]}
                  icon={
                    defaultIcon
                  }
                >
                  <Popup>
                    <div className="min-w-[150px]">
                      <p className="text-xs font-medium text-blue-600">
                        BUS STOP
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {stop.stopName ||
                          stop.name ||
                          `Stop ${index + 1}`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            }
          )}

        {/* TRAIN STATIONS */}

        {isTrain &&
          Array.isArray(
            selectedTransport?.stops
          ) &&
          selectedTransport.stops.map(
            (
              stop,
              index
            ) => {
              const lat =
                Number(
                  stop.lat ??
                    stop.latitude
                )

              const lng =
                Number(
                  stop.lng ??
                    stop.longitude ??
                    stop.lon
                )

              if (
                !Number.isFinite(
                  lat
                ) ||
                !Number.isFinite(
                  lng
                )
              ) {
                return null
              }

              return (
                <Marker
                  key={
                    stop.id ||
                    `${lat}-${lng}-${index}`
                  }
                  position={[
                    lat,
                    lng,
                  ]}
                  icon={
                    defaultIcon
                  }
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="text-xs font-medium text-blue-600">
                        TRAIN STATION
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {stop.stopName ||
                          stop.name ||
                          `Station ${index + 1}`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            }
          )}

        {/* TRANSIT ROUTE */}

        {!isRoadTransport &&
          routeCoordinates.length >
            1 && (
            <Polyline
              positions={
                routeCoordinates
              }
              pathOptions={{
                color:
                  '#374151',
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

        {/* SELECTED PLACE */}

        {hasValidSelectedPlace && (
          <Marker
            position={
              selectedPlacePosition
            }
            icon={
              selectedPlaceIcon
            }
          >
            <Popup className='bg-amber-300'>
              <div className=" flex-col
        overflow-hidden
        rounded-2xl ">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedPlace?.name ||
                    'Selected place'}
                </p>

                {(
                  selectedPlace?.category ||
                  selectedPlace?.type ||
                  selectedPlace?.specialty
                ) && (
                  <p className="mt-1 text-xs capitalize text-gray-500">
                    {selectedPlace.category ||
                      selectedPlace.type ||
                      selectedPlace.specialty}
                  </p>
                )}

                {(
                  selectedPlace?.address ||
                  selectedPlace?.location ||
                  selectedPlace?.city
                ) && (
                  <p className="mt-2 text-xs leading-4 text-gray-600">
                    {selectedPlace.address ||
                      selectedPlace.location ||
                      selectedPlace.city}
                  </p>
                )}

                {selectedPlace?.rating !=
                  null && (
                  <p className="mt-2 text-xs text-gray-600">
                    Rating:{' '}
                    {Number(
                      selectedPlace.rating
                    ).toFixed(1)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* =====================================================
          ROAD ROUTE INFORMATION
      ===================================================== */}
{/* 
      {isRoadTransport &&
        selectedRoadRoute && (
          <div
            className="
              absolute
              left-4
              top-4
              z-[1000]
              w-[310px]
              max-w-[calc(100%-32px)]
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-4
              shadow-lg
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-600">
                  SELECTED ROUTE
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {selectedRoadRoute.label ||
                    `Route ${
                      selectedRoadRoute.routeNumber ||
                      ''
                    }`}
                </p>
              </div>

              <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                Map selected
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Distance
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {Number(
                    selectedRouteDistance ||
                      0
                  ).toFixed(1)}{' '}
                  km
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Time
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {Math.round(
                    selectedRouteDuration ||
                      0
                  )}{' '}
                  min
                </p>
              </div>
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Estimated fare
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <FareItem
                  label="Car"
                  fare={
                    selectedCarFare
                  }
                />

                <FareItem
                  label="Bike"
                  fare={
                    selectedTwoWheelerFare
                  }
                />

                <FareItem
                  label="Auto"
                  fare={
                    selectedAutoFare
                  }
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-400">
              Click another route on the map to change your selection.
            </p>
          </div>
        )} */}

      {/* =====================================================
          ROAD ROUTE LEGEND
      ===================================================== */}

      {/* EMPTY MAP */}

      {!journey &&
        !selectedPlace && (
          <div
            className="
              pointer-events-none
              absolute
              bottom-4
              left-1/2
              z-[500]
              -translate-x-1/2
              rounded-lg
              border
              border-gray-200
              bg-white
              px-4
              py-2
              text-xs
              font-medium
              text-gray-700
              shadow
            "
          >
            Search a route to see it on the map
          </div>
        )}
    </div>
  )
}

/* ============================================================
   FARE ITEM
============================================================ */

function FareItem({
  label,
  fare,
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-2 py-2">
      <p className="text-[10px] text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-semibold text-gray-900">
        ₹{Math.round(fare || 0)}
      </p>
    </div>
  )
}