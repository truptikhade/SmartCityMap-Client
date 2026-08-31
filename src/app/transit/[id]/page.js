'use client'
import { useEffect, useState }    from 'react'
import TripCard from '../../../components/transit/TripCard'
import { useRouter, useParams }   from 'next/navigation'
import { useAuth }                from '../../../hooks/useAuth'
import { getRouteByIdAPI, getStopsAPI, getTripsAPI } from '../../../api/transit.api'
import Navbar                     from '../../../components/ui/Navbar'
import { MapPin, Clock, Bus, ChevronRight, Users, Map } from 'lucide-react'
import { useSocket } from '../../../hooks/useSocket'
import toast from 'react-hot-toast'

export default function TransitDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [route,       setRoute]       = useState(null)
  const [stops,       setStops]       = useState([])
  const [trips,       setTrips]       = useState([])
  const [travelDate,  setTravelDate]  = useState(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(true)
  useSocket(id) 
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const fetchData = async () => {
      try {
        const [routeRes, stopsRes] = await Promise.all([
          getRouteByIdAPI(id),
          getStopsAPI(id),
        ])
        setRoute(routeRes.data.data)
        setStops(stopsRes.data.data)
      } catch {
        toast.error('Failed to load route details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, id])

  // Fetch trips when date changes
  useEffect(() => {
    if (!isAuthenticated || !id) return

    const fetchTrips = async () => {
      try {
        const res = await getTripsAPI(id, travelDate)
        setTrips(res.data.data)
      } catch {
        setTrips([])
      }
    }

    fetchTrips()
  }, [id, travelDate, isAuthenticated])

 const handleBookTrip = (trip) => {
  sessionStorage.setItem('bookingData', JSON.stringify({
    routeId:     id,
    tripId:      trip.id,
    route,
    trip,
    stops,
    travelDate,
    transitType: route.transitType,
    baseFare:    route.baseFare,
  }))
  router.push('/bookings/create')   // ← fixed: plural "bookings"
}
const handleViewOnMap = () => {
  sessionStorage.setItem('routePreview', JSON.stringify({
    routeId:  id,
    routeName: route.routeName,
    stops,
  }))
  router.push('/dashboard?showRoute=1')
}

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">🚌</div>
      </div>
    )
  }

  if (!route) return null

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Route header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Bus size={20} className="text-blue-400" />
            <h1 className="text-white text-xl font-bold">{route.routeName}</h1>
            <span className="text-gray-500 text-sm">#{route.routeNumber}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <MapPin size={14} className="text-green-400" />
            {route.origin}
            <span className="text-gray-600 mx-1">→</span>
            <MapPin size={14} className="text-red-400" />
            {route.destination}
          </div>

          <div className="flex gap-4 text-xs text-gray-500">
            <span>Base fare: ₹{route.baseFare}</span>
            {route.firstDeparture && <span>First: {route.firstDeparture}</span>}
            {route.lastDeparture  && <span>Last:  {route.lastDeparture}</span>}
          </div>
          <button
            onClick={handleViewOnMap}
            className="mt-3 flex items-center gap-1.5 text-blue-400 hover:text-blue-300
                      text-sm font-medium transition"
          >
            <Map size={15} />
            View Route on Map
          </button>
        </div>

        {/* Stops */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-semibold text-sm mb-4">
            🚏 All Stops ({stops.length})
          </h2>
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0
                                   ${index === 0              ? 'bg-green-500'
                                   : index === stops.length-1 ? 'bg-red-500'
                                   :                            'bg-gray-600'}`} />
                  {index < stops.length - 1 && (
                    <div className="w-0.5 h-4 bg-gray-700" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <span className="text-gray-300 text-sm">{stop.stopName}</span>
                  {stop.arrivalTime && (
                    <span className="text-gray-600 text-xs ml-2">
                      {stop.arrivalTime}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date picker + Trips */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">
            🗓️ Available Trips
          </h2>

          {/* Date picker */}
          <input
            type="date"
            value={travelDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setTravelDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white
                       rounded-xl px-4 py-3 mb-4 text-sm focus:outline-none
                       focus:border-blue-500"
          />

          {/* Trips list */}
          {trips.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No trips available for this date
            </p>
          ) : (
            <div className="space-y-3">
              {trips.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No trips available for this date
                </p>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onClick={() => handleBookTrip(trip)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}