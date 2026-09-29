'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Bus, Car, Clock3, Loader2, MapPin, TrainFront, Users } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { getRouteByIdAPI, getStopsAPI, getTripsAPI } from '../../api/transit.api'
import Navbar from '../ui/Navbar'
import TripCard from './TripCard'

const icons = { bus: Bus, train: TrainFront, auto: Car }

export default function TransitDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [route, setRoute] = useState(null)
  const [stops, setStops] = useState([])
  const [trips, setTrips] = useState([])
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    Promise.all([getRouteByIdAPI(id), getStopsAPI(id)])
      .then(([routeResponse, stopsResponse]) => {
        setRoute(routeResponse.data.data)
        setStops(stopsResponse.data.data || [])
      })
      .catch(() => toast.error('Could not load route'))
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !id || !travelDate) return
    getTripsAPI(id, travelDate)
      .then((response) => setTrips(response.data.data || []))
      .catch(() => setTrips([]))
  }, [id, travelDate, isAuthenticated])

  const bookTrip = (trip) => {
    sessionStorage.setItem('bookingData', JSON.stringify({
      routeId: id,
      tripId: trip.id,
      route,
      trip,
      stops,
      travelDate,
      transitType: route.transitType,
      baseFare: route.baseFare,
      boardingStop: stops[0] || null,
      dropStop: stops[stops.length - 1] || null,
    }))
    router.push('/bookings/create')
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  if (!route) return null

  const Icon = icons[route.transitType] || Bus

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft size={15} /> Back
        </button>

        <section className="border border-gray-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <Icon size={19} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-950">{route.routeName}</h1>
              <p className="mt-1 text-sm text-gray-500">Route {route.routeNumber}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-green-600" />{route.origin}</span>
            <span className="text-gray-300">to</span>
            <span className="flex items-center gap-1"><MapPin size={14} className="text-red-500" />{route.destination}</span>
          </div>
        </section>

        <section className="mt-4 border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Stops</h2>
          <div className="mt-4 space-y-2">
            {stops.map((stop, index) => (
              <div key={stop.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-green-600' : index === stops.length - 1 ? 'bg-red-500' : 'bg-gray-300'}`} />
                  {index < stops.length - 1 && <span className="h-7 w-px bg-gray-200" />}
                </div>
                <div className="text-sm text-gray-700">
                  {stop.stopName}
                  {stop.arrivalTime && <span className="ml-2 text-xs text-gray-400">{stop.arrivalTime}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Available trips</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-gray-500"><Clock3 size={13} />Choose your departure.</p>
            </div>
            <input
              type="date"
              value={travelDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => setTravelDate(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-4 space-y-2">
            {trips.length ? trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} transitType={route.transitType} onClick={() => bookTrip(trip)} />
            )) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No trips available for this date.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
