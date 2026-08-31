'use client'
import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams }  from 'next/navigation'
import { useSelector, useDispatch }    from 'react-redux'
import dynamic         from 'next/dynamic'
import { useAuth }     from '../../hooks/useAuth'
import { useLocation } from '../../hooks/useLocation'
import { getNearbyPlacesAPI } from '../../api/places.api'
import { setNearbyPlaces, setActiveRoute } from '../../store/mapSlice'
import Navbar  from '../../components/ui/Navbar'
import Sidebar from '../../components/ui/Sidebar'

const MapView = dynamic(() => import('../../components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-900">
      <div className="animate-spin text-3xl">🗺️</div>
    </div>
  ),
})

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Wrapper so useSearchParams works with Next.js App Router's Suspense requirement
function RouteParamHandler() {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('showRoute') !== '1') return

    const stored = sessionStorage.getItem('routePreview')
    if (!stored) return

    try {
      dispatch(setActiveRoute(JSON.parse(stored)))
    } catch (err) {
      console.error('Failed to parse routePreview:', err)
    }
    sessionStorage.removeItem('routePreview')
  }, [searchParams, dispatch])

  return null
}

export default function Dashboard() {
  const router   = useRouter()
  const dispatch = useDispatch()

  const { isAuthenticated, loading: authLoading } = useAuth()
  const { loading: locationLoading } = useLocation()
  const userLocation = useSelector((state) => state.map.userLocation)
  const activeRoute  = useSelector((state) => state.map.activeRoute)

  const lastFetchedLocation = useRef(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!userLocation) return

    const last = lastFetchedLocation.current
    const moved = last
      ? haversineMeters(last.lat, last.lng, userLocation.lat, userLocation.lng)
      : Infinity

    if (moved < 200) return

    lastFetchedLocation.current = userLocation

    const fetchNearby = async () => {
      try {
        const res = await getNearbyPlacesAPI({
          lat:    userLocation.lat,
          lng:    userLocation.lng,
          radius: 2000,
        })
        dispatch(setNearbyPlaces(res.data.data))
      } catch (err) {
        console.error('Failed to fetch nearby places:', err)
      }
    }

    fetchNearby()
  }, [userLocation, dispatch])

  const handleClearRoute = () => {
    dispatch(setActiveRoute(null))
  }

  if (authLoading || locationLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🗺️</div>
          <p className="text-white text-lg">
            {authLoading ? 'Checking session...' : 'Getting your location...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Suspense fallback={null}>
        <RouteParamHandler />
      </Suspense>

      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 relative">
          {activeRoute && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]
                            bg-gray-900 border border-gray-700 rounded-xl px-4 py-2
                            flex items-center gap-3 shadow-lg">
              <span className="text-white text-sm font-medium">{activeRoute.routeName}</span>
              <button
                onClick={handleClearRoute}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕ Clear
              </button>
            </div>
          )}
          <MapView />
        </div>
      </div>
    </div>
  )
}