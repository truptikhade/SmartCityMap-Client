'use client'
import { useEffect, useState }      from 'react'
import { useRouter }                from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth }                  from '../hooks/useAuth'
import { setNearbyPlaces, setUserLocation, setSelectedPlace } from '../store/mapSlice'
import { getNearbyPlacesAPI }       from '../api/places.api'
import Navbar                       from '../components/ui/Navbar'
import Sidebar                      from '../components/ui/Sidebar'   // ← import Sidebar
import dynamic                      from 'next/dynamic'
import toast from 'react-hot-toast'

const MapView = dynamic(
  () => import('../components/map/MapView'),
  { ssr: false, loading: () => (
    <div className="flex-1 bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">🗺️</div>
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    </div>
  )}
)

export default function HomePage() {
  const router   = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const userLocation  = useSelector((state) => state.map.userLocation)
  const selectedPlace = useSelector((state) => state.map.selectedPlace)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  // Get user location
  useEffect(() => {
    if (!isAuthenticated) return

    if (!navigator.geolocation) {
      dispatch(setUserLocation({ lat: 19.9975, lng: 73.7898 }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }))
      },
      () => {
        dispatch(setUserLocation({ lat: 19.9975, lng: 73.7898 }))
      }
    )
  }, [isAuthenticated, dispatch])

  // Fetch nearby places when location is available
  useEffect(() => {
    if (!userLocation) return

    const fetchNearby = async () => {
      try {
        const res = await getNearbyPlacesAPI({
          lat:    userLocation.lat,
          lng:    userLocation.lng,
          radius: 3000,
        })
        dispatch(setNearbyPlaces(res.data.data || []))
      } catch (err) {
        console.error('Places error:', err)
      }
    }

    fetchNearby()
  }, [userLocation, dispatch])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-4xl">🗺️</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">

        {/* ← Use Sidebar component — has Details button + category filter */}
        <Sidebar />

        {/* Map */}
        <div className="flex-1 relative">
          <MapView />

          {/* Selected place popup overlay */}
          {selectedPlace && (
            <PlacePopup
              place={selectedPlace}
              onClose={() => dispatch(setSelectedPlace(null))}
              onViewDetail={() => router.push(`/places/${selectedPlace.id}`)}
            />
          )}
        </div>

      </div>
    </div>
  )
}

// Popup that appears on map when place is selected
function PlacePopup({ place, onClose, onViewDetail }) {
  const categoryColors = {
    hospital:   'bg-red-600',
    restaurant: 'bg-orange-600',
    market:     'bg-yellow-600',
    temple:     'bg-purple-600',
    atm:        'bg-green-600',
    pharmacy:   'bg-blue-600',
    other:      'bg-gray-600',
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2
                    bg-gray-900 border border-gray-700 rounded-2xl
                    shadow-2xl p-5 w-72 z-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="text-white font-semibold text-sm">{place.name}</h3>
          <span className={`text-xs text-white px-2 py-0.5 rounded-full mt-1 inline-block
                            ${categoryColors[place.category] || 'bg-gray-600'}`}>
            {place.category}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xl leading-none transition"
        >
          ×
        </button>
      </div>

      {place.address && (
        <p className="text-gray-400 text-xs mb-3">{place.address}</p>
      )}

      <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
        <span className="text-yellow-400">
          ⭐ {Number(place.rating || 0).toFixed(1)}
        </span>
        {place.openHours && <span>🕐 {place.openHours}</span>}
        {place.distance != null && (
          <span>
            📍 {place.distance < 1000
              ? `${Math.round(Number(place.distance))}m`
              : `${(Number(place.distance) / 1000).toFixed(1)}km`}
          </span>
        )}
      </div>

      <button
        onClick={onViewDetail}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs
                   font-medium rounded-xl py-2.5 transition"
      >
        View Details & Reviews →
      </button>
    </div>
  )
}