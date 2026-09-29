'use client'
import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { MapPin, Star, Loader2 }        from 'lucide-react'
import { getAllPlacesAPI }     from '../../api/places.api'
import Navbar                  from '../../components/ui/Navbar'

export default function PlacesPage() {
  const router = useRouter()
  const [places, setPlaces]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await getAllPlacesAPI({ page: 1, limit: 20 })
        setPlaces(res.data.data.places || [])
      } catch (err) {
        console.error('Failed to load places:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlaces()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl"><Loader2 size={32} /></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-6">All Places</h1>
        <div className="space-y-3">
          {places.map((place) => (
            <div
              key={place.id}
              onClick={() => router.push(`/places/${place.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 cursor-pointer hover:border-blue-600 transition"
            >
              <h3 className="text-white font-medium text-sm">{place.name}</h3>
              <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                <MapPin size={11} />
                {place.address || 'No address'}
              </p>
              <span className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                <Star size={11} fill="currentColor" />
                {Number(place.rating || 0).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}