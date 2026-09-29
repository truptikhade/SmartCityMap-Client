'use client'

import { useEffect, useState } from 'react'

import {
  useDispatch,
  useSelector,
} from 'react-redux'

import { useRouter } from 'next/navigation'

import toast from 'react-hot-toast'

import {
  setUserLocation,
  setJourney,
  setSelectedTransport,
  setSelectedPlace,
  clearJourney,
} from '../../store/mapSlice'

import { useAuth } from '../../hooks/useAuth'

import Navbar from '../ui/Navbar'

import JourneySearch from '../journey/JourneySearch'
import JourneyMap from '../journey/JourneyMap'
import TransportOptions from '../journey/TransportOptions'

import AIAssistantButton from '../ai/AIAssistantButton'
import AIAssistantPanel from '../ai/AIAssistantPanel'

import TransitRouteMap from '../transit/TransitRouteMap'

import { createRideAPI } from '../../api/ride.api'

export default function HomePage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const userLocation = useSelector(
    (state) =>
      state.map.userLocation
  )

  const journey = useSelector(
    (state) =>
      state.map.journey
  )

  const selectedTransport =
    useSelector(
      (state) =>
        state.map.selectedTransport
    )

  const selectedPlace =
    useSelector(
      (state) =>
        state.map.selectedPlace
    )

  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useAuth()

  const [mounted, setMounted] =
    useState(false)

  const [
    assistantOpen,
    setAssistantOpen,
  ] = useState(false)

  // =====================================================
  // CLIENT MOUNTED
  // =====================================================

  useEffect(() => {
    setMounted(true)
  }, [])

  // =====================================================
  // AUTHENTICATION + ROLE ROUTING
  // =====================================================

  useEffect(() => {
    if (
      !mounted ||
      authLoading
    ) {
      return
    }

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (
      user?.role === 'driver'
    ) {
      router.replace('/driver')
      return
    }

    if (
      user?.role === 'admin'
    ) {
      router.replace('/admin')
    }
  }, [
    mounted,
    authLoading,
    isAuthenticated,
    user?.role,
    router,
  ])

  // =====================================================
  // USER LOCATION
  // =====================================================

  useEffect(() => {
    if (
      !mounted ||
      !isAuthenticated ||
      user?.role !== 'user' ||
      userLocation
    ) {
      return
    }

    if (
      !navigator.geolocation
    ) {
      dispatch(
        setUserLocation({
          lat: 19.9975,
          lng: 73.7898,
        })
      )

      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        dispatch(
          setUserLocation({
            lat:
              coords.latitude,
            lng:
              coords.longitude,
          })
        )
      },
      () => {
        dispatch(
          setUserLocation({
            lat: 19.9975,
            lng: 73.7898,
          })
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    )
  }, [
    mounted,
    isAuthenticated,
    user?.role,
    userLocation,
    dispatch,
  ])

  // =====================================================
  // JOURNEY SEARCH
  // =====================================================

  const handleJourneySearch = (
    result
  ) => {
    dispatch(
      setJourney(result)
    )

    dispatch(
      setSelectedTransport(
        null
      )
    )

    dispatch(
      setSelectedPlace(null)
    )
  }

  // =====================================================
  // RESOLVE ROAD ROUTE
  // =====================================================

  const resolveRoadRoute = (
    option
  ) => {
    if (!option) {
      return null
    }

    if (option.roadRoute) {
      return option.roadRoute
    }

    if (
      Array.isArray(
        option.roadRoutes
      ) &&
      option.roadRoutes.length >
        0
    ) {
      if (
        option.roadRouteId
      ) {
        const selectedRoute =
          option.roadRoutes.find(
            (route) =>
              String(
                route?.id
              ) ===
              String(
                option.roadRouteId
              )
          )

        if (selectedRoute) {
          return selectedRoute
        }
      }

      return option.roadRoutes[0]
    }

    return null
  }

  // =====================================================
  // VIEW TRANSPORT ROUTE ON MAP
  // =====================================================

  const handleTransportMap = (
    option
  ) => {
    if (!option) {
      toast.error(
        'Transport information is not available'
      )

      return
    }

    const transportType =
      String(
        option.transportType ||
          option.transitType ||
          ''
      ).toLowerCase()

    const isPublicTransport =
      transportType === 'bus' ||
      transportType === 'train'

    if (
      isPublicTransport &&
      !option.routeId
    ) {
      toast.error(
        'Route information is not available'
      )

      return
    }

    if (
      !isPublicTransport
    ) {
      const roadRoute =
        resolveRoadRoute(
          option
        )

      if (!roadRoute) {
        toast.error(
          'Road route information is not available'
        )

        return
      }

      dispatch(
        setSelectedPlace(null)
      )

      dispatch(
        setSelectedTransport({
          ...option,
          roadRoute,
        })
      )

      return
    }

    dispatch(
      setSelectedPlace(null)
    )

    dispatch(
      setSelectedTransport(
        option
      )
    )
  }

  // =====================================================
  // CLOSE ROUTE MAP
  // =====================================================

  const handleCloseRouteMap =
    () => {
      dispatch(
        setSelectedTransport(
          null
        )
      )
    }

  // =====================================================
  // LOCATE AI PLACE
  // =====================================================

  const handleLocatePlace = (
    place
  ) => {
    if (!place) {
      return
    }

    dispatch(
      setSelectedPlace(place)
    )
  }

  // =====================================================
  // BOOKING
  // =====================================================

  const handleBook = async (
    option
  ) => {
    if (!option) {
      toast.error(
        'Transport option is not available'
      )

      return
    }

    const transportType =
      String(
        option.transportType ||
          option.transitType ||
          ''
      ).toLowerCase()

    const vehicleType =
      transportType ===
      'twowheeler'
        ? 'twoWheeler'
        : transportType

    const isRoadTransport =
      vehicleType === 'car' ||
      vehicleType ===
        'twoWheeler' ||
      vehicleType === 'auto'

    // ===================================================
    // CAR / TWO WHEELER / AUTO
    // ===================================================

    if (isRoadTransport) {
      const fromLat =
        Number(
          journey?.from?.lat ??
            journey?.from?.latitude ??
            journey?.fromLat
        )

      const fromLng =
        Number(
          journey?.from?.lng ??
            journey?.from?.longitude ??
            journey?.fromLng
        )

      const toLat =
        Number(
          journey?.to?.lat ??
            journey?.to?.latitude ??
            journey?.toLat
        )

      const toLng =
        Number(
          journey?.to?.lng ??
            journey?.to?.longitude ??
            journey?.toLng
        )

      if (
        !Number.isFinite(
          fromLat
        ) ||
        !Number.isFinite(
          fromLng
        ) ||
        !Number.isFinite(
          toLat
        ) ||
        !Number.isFinite(
          toLng
        )
      ) {
        toast.error(
          'Pickup or destination coordinates are missing'
        )

        return
      }

      const roadRoute =
        resolveRoadRoute(
          option
        )

      if (!roadRoute) {
        toast.error(
          'Please select a road route first'
        )

        return
      }

      const distanceKm =
        Number(
          option.distanceKm ??
            roadRoute.distanceKm ??
            roadRoute.distance ??
            0
        )

      const durationMinutes =
        Number(
          option.durationMinutes ??
            roadRoute.durationMinutes ??
            roadRoute.duration ??
            0
        )

      const estimatedFare =
        Number(
          option.estimatedFare ??
            option.fare ??
            roadRoute.estimatedFare ??
            roadRoute.fare ??
            0
        )

      try {
        const payload = {
          pickupLat:
            fromLat,

          pickupLng:
            fromLng,

          pickupAddress:
            journey?.from?.name ||
            journey?.from
              ?.display_name ||
            String(
              journey?.from ||
                'Pickup location'
            ),

          destinationLat:
            toLat,

          destinationLng:
            toLng,

          destinationAddress:
            journey?.to?.name ||
            journey?.to
              ?.display_name ||
            String(
              journey?.to ||
                'Destination'
            ),

          distanceKm,

          durationMinutes,

          estimatedFare,

          vehicleType,
        }

        toast.loading(
          'Requesting your ride...',
          {
            id:
              'ride-request',
          }
        )

        const response =
          await createRideAPI(
            payload
          )

        toast.dismiss(
          'ride-request'
        )

        const ride =
          response?.data ||
          response?.ride ||
          response

        if (!ride?.id) {
          throw new Error(
            'Ride request was created but no ride ID was returned'
          )
        }

        sessionStorage.setItem(
          'activeRide',
          JSON.stringify({
            ride,

            option: {
              ...option,
              roadRoute,
            },

            journey,
          })
        )

        toast.success(
          'Ride requested successfully'
        )

        router.push(
          `/rides/${ride.id}`
        )
      } catch (error) {
        console.error(
          'Create ride error:',
          error
        )

        toast.dismiss(
          'ride-request'
        )

        toast.error(
          error?.response
            ?.data?.message ||
            error?.message ||
            'Unable to request ride'
        )
      }

      return
    }

    // ===================================================
    // BUS / TRAIN
    // ===================================================

    if (!option.routeId) {
      toast.error(
        'This transport option cannot be booked online'
      )

      return
    }

    if (
      !option.trip &&
      !option.tripId
    ) {
      toast.error(
        'No bookable trip is available for this route'
      )

      return
    }

    const tripId =
      option.trip?.id ||
      option.tripId

    const bookingData = {
      routeId:
        option.routeId,

      tripId,

      route: {
        id:
          option.routeId,

        routeName:
          option.routeName ||
          option.route
            ?.routeName ||
          'Transit journey',

        routeNumber:
          option.routeNumber ||
          option.route
            ?.routeNumber ||
          null,

        transitType:
          option.transitType ||
          option.transportType ||
          null,

        origin:
          option.origin ||
          option.route?.origin ||
          option.from?.name ||
          journey?.from?.name ||
          null,

        destination:
          option.destination ||
          option.route?.destination ||
          option.to?.name ||
          journey?.to?.name ||
          null,
      },

      trip:
        option.trip ||
        null,

      stops:
        option.stops ||
        [],

      travelDate:
        option.travelDate ||
        option.trip
          ?.travelDate ||
        new Date()
          .toISOString(),

      transitType:
        option.transitType ||
        option.transportType ||
        null,

      baseFare:
        Number(
          option.estimatedFare ??
            option.fare ??
            option.baseFare ??
            0
        ),

      boardingStop:
        option.boardingStop ||
        null,

      dropStop:
        option.dropStop ||
        null,

      distanceKm:
        option.distanceKm ||
        null,

      durationMinutes:
        option.durationMinutes ||
        null,

      from:
        option.from ||
        journey?.from ||
        null,

      to:
        option.to ||
        journey?.to ||
        null,
    }

    sessionStorage.setItem(
      'bookingData',
      JSON.stringify(
        bookingData
      )
    )

    router.push(
      '/bookings/create'
    )
  }

  // =====================================================
  // HYDRATION-SAFE LOADING
  // =====================================================

  if (
    !mounted ||
    authLoading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      </div>
    )
  }

  // =====================================================
  // DO NOT RENDER DRIVER / ADMIN UI
  // =====================================================

  if (
    !isAuthenticated ||
    user?.role === 'driver' ||
    user?.role === 'admin'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm text-gray-500">
          Redirecting...
        </div>
      </div>
    )
  }

  // =====================================================
  // AI COORDINATES
  // =====================================================

  const aiLatitude =
    journey?.from?.lat ??
    journey?.from?.latitude ??
    journey?.fromLat ??
    userLocation?.lat ??
    19.9975

  const aiLongitude =
    journey?.from?.lng ??
    journey?.from?.longitude ??
    journey?.fromLng ??
    userLocation?.lng ??
    73.7898

  // =====================================================
  // MAP CENTER
  // =====================================================

  const mapCenter =
    userLocation
      ? [
          userLocation.lat,
          userLocation.lng,
        ]
      : [
          19.9975,
          73.7898,
        ]

  // =====================================================
  // SELECTED TRANSPORT TYPE
  // =====================================================

  const selectedTransportType =
    String(
      selectedTransport?.transportType ||
        selectedTransport?.transitType ||
        ''
    ).toLowerCase()

  const isSelectedBus =
    selectedTransportType ===
    'bus'

  const isSelectedTrain =
    selectedTransportType ===
    'train'

  const isSelectedPublicTransport =
    isSelectedBus ||
    isSelectedTrain

  const showTransitRouteMap =
    Boolean(
      selectedTransport?.routeId &&
        isSelectedPublicTransport
    )

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-900">
      <Navbar />

      <main className="h-[calc(100vh-73px)] w-full overflow-hidden">
        <section className="h-full w-full">
          <div className="grid h-full w-full grid-cols-1 gap-0 lg:grid-cols-[420px_minmax(0,1fr)]">
            {/* =================================================
                LEFT PANEL
            ================================================== */}

            <div className="h-full space-y-4 overflow-y-auto bg-gray-50 p-4">
              <JourneySearch
                onSearch={
                  handleJourneySearch
                }

                onClear={() => {
                  dispatch(
                    clearJourney()
                  )
                }}

                currentLocation={
                  userLocation
                }

                initialFrom={
                  journey?.from
                    ?.name ||
                  journey?.from
                    ?.display_name ||
                  ''
                }

                initialTo={
                  journey?.to
                    ?.name ||
                  journey?.to
                    ?.display_name ||
                  ''
                }
              />

              {/* JOURNEY RESULT */}

              {journey && (
                <>
                  <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-600" />

                        <span className="my-1 h-7 border-l border-dashed border-gray-300" />

                        <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {journey.from?.name ||
                            journey.from
                              ?.display_name ||
                            journey.from ||
                            'Starting point'}
                        </p>

                        <p className="my-2 text-xs text-gray-400">
                          {journey.distanceKm
                            ? `${Number(
                                journey.distanceKm
                              ).toFixed(
                                2
                              )} km`
                            : 'Route found'}
                        </p>

                        <p className="truncate text-sm font-medium text-gray-900">
                          {journey.to?.name ||
                            journey.to
                              ?.display_name ||
                            journey.to ||
                            'Destination'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <TransportOptions
                    journey={journey}
                    onBook={
                      handleBook
                    }
                    onViewMap={
                      handleTransportMap
                    }
                  />
                </>
              )}
            </div>

            {/* =================================================
                MAP AREA
            ================================================== */}

            <div className="relative h-full w-full min-w-0">
              {/* =================================================
                  BUS / TRAIN ROUTE MAP
              ================================================== */}

              {showTransitRouteMap ? (
                <div className="absolute inset-0 flex flex-col overflow-hidden border border-gray-200 bg-gray-100">
                  {/* Dedicated header */}

                  <div className="flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-4">
                    <button
                      type="button"
                      onClick={
                        handleCloseRouteMap
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        px-3.5
                        py-2
                        text-sm
                        font-medium
                        text-gray-700
                        shadow-sm
                        transition
                        hover:bg-gray-50
                      "
                    >
                      <span aria-hidden="true">
                        ←
                      </span>

                      <span>
                        Back to journey
                      </span>
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden">
                    <TransitRouteMap
                      routeId={
                        selectedTransport.routeId
                      }

                      transitType={
                        selectedTransport.transitType ||
                        selectedTransport.transportType
                      }

                      date={
                        new Date()
                          .toISOString()
                          .split(
                            'T'
                          )[0]
                      }

                      onSelectVehicle={(
                        vehicle
                      ) => {
                        if (
                          !vehicle?.id
                        ) {
                          toast.error(
                            'Vehicle information is unavailable'
                          )

                          return
                        }

                        router.push(
                          `/transit/live/${vehicle.id}`
                        )
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* =================================================
                   NORMAL JOURNEY / ROAD ROUTE MAP
                ================================================== */

                <div className="absolute inset-0 overflow-hidden border border-gray-200 bg-gray-100">
                  <JourneyMap
                    journey={
                      journey
                    }

                    initialCenter={
                      mapCenter
                    }

                    selectedPlace={
                      selectedPlace
                    }

                    selectedTransport={
                      selectedTransport
                    }
                  />
                </div>
              )}

             {/* =================================================
    AI ASSISTANT PANEL
================================================== */}

{assistantOpen && (
  <div
    className="
      pointer-events-none
      absolute
      inset-0
      z-[3000]
    "
  >
    <div className="absolute bottom-5 right-5">
      <AIAssistantPanel
        lat={aiLatitude}
        lng={aiLongitude}
        onLocate={handleLocatePlace}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  </div>
)}

{/* =================================================
    AI BUTTON
================================================== */}

{!assistantOpen && (
  <div className="absolute bottom-5 right-5 z-[3100]">
    <AIAssistantButton
      open={false}
      onClick={() => setAssistantOpen(true)}
    />
  </div>
)}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}