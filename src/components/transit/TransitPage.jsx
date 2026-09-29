'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bus, Car, Loader2, Search, TrainFront } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { getRoutesAPI, getStopsAPI } from '../../api/transit.api'
import Navbar from '../ui/Navbar'
import RouteCard from './RouteCard'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'train', label: 'Train', icon: TrainFront },
  { id: 'auto', label: 'Auto', icon: Car },
]

export default function TransitPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [routes, setRoutes] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const load = async () => {
      setLoading(true)
      try {
        const response = await getRoutesAPI(filter === 'all' ? {} : { type: filter })
        setRoutes(response.data.data || [])
      } catch {
        toast.error('Could not load transit routes')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isAuthenticated, filter])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return routes
    return routes.filter((route) =>
      [route.routeName, route.origin, route.destination, route.routeNumber]
        .some((value) => String(value || '').toLowerCase().includes(query))
    )
  }, [routes, search])

  const viewOnMap = async (route) => {
    try {
      const response = await getStopsAPI(route.id)
      sessionStorage.setItem('routePreview', JSON.stringify({
        routeId: route.id,
        routeName: route.routeName,
        stops: response.data.data,
        transitType: route.transitType,
      }))
      router.push('/dashboard?showRoute=1')
    } catch {
      toast.error('Could not load route map')
    }
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div>
          <p className="text-sm text-blue-600">Public transport</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">Transit routes</h1>
          <p className="mt-2 text-sm text-gray-500">Browse available routes and scheduled trips.</p>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
          <Search size={17} className="text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by route, origin or destination"
            className="w-full py-3 text-sm outline-none"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {filters.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
                  filter === item.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {Icon && <Icon size={14} />}
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : filtered.length ? (
            <div className="space-y-3">
              {filtered.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => router.push(`/transit/${route.id}`)}
                  onViewMap={viewOnMap}
                />
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
              No routes found.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
