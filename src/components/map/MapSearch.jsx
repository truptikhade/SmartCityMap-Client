'use client'
import { useState } from 'react'
import { Search, X, Loader } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setNearbyPlaces } from '../../store/mapSlice'
import { getNearbyPlacesAPI } from '../../api/places.api'

const categoryEmojis = {
  hospital:   '🏥',
  restaurant: '🍽️',
  market:     '🛒',
  temple:     '🛕',
  atm:        '🏧',
  pharmacy:   '💊',
  school:     '🏫',
  cafe:       '☕',
  other:      '📍',
}

export default function MapSearch() {
  const dispatch = useDispatch()
  const userLocation = useSelector((state) => state.map.userLocation)
  const nearbyPlaces = useSelector((state) => state.map.nearbyPlaces)

  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [error, setError] = useState('')

  const categories = [
    { value: 'hospital', label: '🏥 Hospital' },
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'cafe', label: '☕ Cafe' },
    { value: 'market', label: '🛒 Market' },
    { value: 'pharmacy', label: '💊 Pharmacy' },
    { value: 'temple', label: '🛕 Temple' },
    { value: 'atm', label: '🏧 ATM' },
  ]

  // Search by query from map
  const handleMapSearch = async () => {
    setError('')
    if (!userLocation) {
      setError('Please enable location access')
      return
    }

    if (!searchQuery.trim()) {
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    try {
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 5000,
        search: searchQuery.trim(),
      }

      const res = await getNearbyPlacesAPI(params)
      const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.places || []
      dispatch(setNearbyPlaces(data))
      setIsOpen(true)
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Search by category from map
  const handleCategorySearch = async (category) => {
    setError('')
    if (!userLocation) {
      setError('Please enable location access')
      return
    }

    setSelectedCategory(category)
    setLoading(true)
    try {
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 5000,
        category: category,
      }

      const res = await getNearbyPlacesAPI(params)
      const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.places || []
      dispatch(setNearbyPlaces(data))
      setIsOpen(true)
    } catch (err) {
      console.error('Category search failed:', err)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter results locally
  const filteredResults = nearbyPlaces.filter((p) => {
    const matchesQuery = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesQuery
  })

  // Don't render if no location
  if (!userLocation) {
    return null
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] w-96 max-w-[calc(100%-2rem)]">
      
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search cafes, hospitals, restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
            className="w-full px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500 shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={handleMapSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 flex items-center gap-2 shadow-lg"
        >
          {loading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      {/* Quick Category Filters */}
      <div className="mt-3 bg-white rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Quick Search:</p>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategorySearch(cat.value)}
              disabled={loading}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Panel */}
      {isOpen && (
        <div className="mt-3 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {filteredResults.length} places found
              </p>
              <p className="text-xs text-gray-500">
                within 5km of your location
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results List */}
          {filteredResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredResults.map((place) => (
                <div
                  key={place.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition border-l-4 border-l-blue-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {categoryEmojis[place.category] || '📍'}
                        </span>
                        <h4 className="font-semibold text-sm text-gray-900">
                          {place.name}
                        </h4>
                      </div>
                      
                      {place.address && (
                        <p className="text-xs text-gray-600 mb-1">
                          📍 {place.address}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-xs">⭐</span>
                          <span className="text-xs font-medium text-gray-700">
                            {Number(place.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        {place.distance && (
                          <span className="text-xs text-gray-500">
                            🚶 {place.distance < 1000
                              ? `${Math.round(place.distance)}m`
                              : `${(place.distance / 1000).toFixed(1)}km`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">No places found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term or category</p>
            </div>
          )}
        </div>
      )}

      {/* Show results count when collapsed */}
      {!isOpen && nearbyPlaces.length > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="mt-2 w-full bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition shadow-lg"
        >
          📍 Show {nearbyPlaces.length} results
        </button>
      )}
    </div>
  )
}

