'use client'
import { useEffect, useState }  from 'react'
import { useRouter }            from 'next/navigation'
import { useAuth }              from '../../hooks/useAuth'
import { getRoutesAPI, getStopsAPI } from '../../api/transit.api'
import Navbar                   from '../../components/ui/Navbar'
import RouteCard                from '../../components/transit/RouteCard'
import toast from 'react-hot-toast'

export default function TransitPage() {
  const router  = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [routes,   setRoutes]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchRoutes = async () => {
      setLoading(true)
      try {
        const params = filter !== 'all' ? { type: filter } : {}
        const res    = await getRoutesAPI(params)
        setRoutes(res.data.data)
      } catch (err) {
        console.error('Transit error:', err)
        toast.error('Failed to load routes')
      } finally {
        setLoading(false)
      }
    }
    fetchRoutes()
  }, [isAuthenticated, filter])

  const filtered = routes.filter((r) =>
    r.routeName.toLowerCase().includes(search.toLowerCase()) ||
    r.origin.toLowerCase().includes(search.toLowerCase()) ||
    r.destination.toLowerCase().includes(search.toLowerCase())
  )

  const handleViewOnMap = async (route) => {
    try {
      const res = await getStopsAPI(route.id)
      const stops = res.data.data

      sessionStorage.setItem('routePreview', JSON.stringify({
        routeId:  route.id,
        routeName: route.routeName,
        stops,
      }))

      router.push('/dashboard?showRoute=1')
    } catch (err) {
      toast.error('Failed to load route path')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">🚌</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">

        <h1 className="text-white text-2xl font-bold mb-6">
          🚌 Transit Routes
        </h1>

        <input
          type="text"
          placeholder="Search routes, origin, destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-white
                     rounded-xl px-4 py-3 mb-4 focus:outline-none
                     focus:border-blue-500 placeholder-gray-500 text-sm"
        />

        <div className="flex gap-2 mb-6">
          {['all', 'bus', 'train', 'auto'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition
                         ${filter === type
                           ? 'bg-blue-600 text-white'
                           : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500">No routes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onClick={() => router.push(`/transit/${route.id}`)}
                onViewMap={handleViewOnMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}