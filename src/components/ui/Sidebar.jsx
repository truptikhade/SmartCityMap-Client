'use client'
import { useRouter }                from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedPlace, setNearbyPlaces } from '../../store/mapSlice'
import { MapPin, Star, Navigation, Bus, Search, X, Loader } from 'lucide-react'
import { useState }                 from 'react'
import { getNearbyPlacesAPI }       from '../../api/places.api'
import { getAIRecommendationsAPI } from '../../api/places.api'
import { Sparkles } from 'lucide-react'

const categoryColors = {
  hospital:   'bg-red-500',
  restaurant: 'bg-orange-500',
  market:     'bg-yellow-500',
  temple:     'bg-purple-500',
  atm:        'bg-green-500',
  pharmacy:   'bg-blue-500',
  school:     'bg-indigo-500',
  cafe:       'bg-amber-500',
  other:      'bg-gray-500',
}

const categories = ['all', 'hospital', 'restaurant', 'cafe', 'market', 'temple', 'atm', 'pharmacy']

const Sidebar = () => {
  const router        = useRouter()
  const dispatch      = useDispatch()
  const nearbyPlaces  = useSelector((state) => state.map.nearbyPlaces)
  const selectedPlace = useSelector((state) => state.map.selectedPlace)
  const userLocation  = useSelector((state) => state.map.userLocation)

  const [activeCategory, setActiveCategory] = useState('all')
  const [search,         setSearch]         = useState('')
  const [filtering,      setFiltering]      = useState(false)
  const [error,          setError]          = useState('')

  const [aiRecs,      setAiRecs]      = useState([])
  const [aiMessage,   setAiMessage]   = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [showAI,      setShowAI]      = useState(false)

  // Text search - call API with search parameter
  const handleTextSearch = async () => {
    if (!userLocation) {
      setError('Please enable location access')
      return
    }

    if (!search.trim()) {
      setError('Please enter a search term')
      return
    }

    setError('')
    setFiltering(true)
    try {
      const params = {
        lat:    userLocation.lat,
        lng:    userLocation.lng,
        radius: 5000,
        search: search.trim(),
      }

      const res = await getNearbyPlacesAPI(params)
      const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.places || []
      dispatch(setNearbyPlaces(data))
      setActiveCategory('all')
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search failed. Try again.')
    } finally {
      setFiltering(false)
    }
  }

  // Filter by category
  const handleCategoryClick = async (cat) => {
    setActiveCategory(cat)
    setSearch('')
    setError('')
    
    if (!userLocation) {
      setError('Please enable location access')
      return
    }

    setFiltering(true)
    try {
      const params = {
        lat:    userLocation.lat,
        lng:    userLocation.lng,
        radius: 5000,
      }
      if (cat !== 'all') params.category = cat

      const res = await getNearbyPlacesAPI(params)
      const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.places || []
      dispatch(setNearbyPlaces(data))
    } catch (err) {
      console.error('Filter failed:', err)
      setError('Filter failed. Try again.')
    } finally {
      setFiltering(false)
    }
  }

  // Select place on map
  const handlePlaceClick = (place) => {
    dispatch(setSelectedPlace(place))
  }

  // Go to detail page
  const handleViewDetail = (e, placeId) => {
    e.stopPropagation()
    router.push(`/places/${placeId}`)
  }

  // Filter by search locally
  const filteredPlaces = nearbyPlaces.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  })

  const fetchAIRecommendations = async () => {
    if (!userLocation) return
    setAiLoading(true)
    setShowAI(true)
    try {
      const res = await getAIRecommendationsAPI({
        lat:    userLocation.lat,
        lng:    userLocation.lng,
        radius: 3000,
      })
      setAiRecs(res.data.data.recommendations || [])
      setAiMessage(res.data.data.aiMessage || '')
    } catch(err) {
       console.error('AI fetch failed:', err)
    console.error('Response:', err.response?.data)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
          <Navigation size={16} className="text-blue-400" />
          Nearby Places
          <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {filteredPlaces.length}
          </span>
        </h2>

        {/* Search bar with quick server search */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
            placeholder="Search places..."
            className="w-full bg-gray-800 border border-gray-700 text-white
                       rounded-xl pl-8 pr-8 py-2 text-xs
                       focus:outline-none focus:border-blue-500
                       placeholder-gray-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500
                        hover:text-white transition"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={handleTextSearch}
          disabled={filtering || !search.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white
                     text-xs font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 mb-2"
        >
          {filtering ? (
            <>
              <Loader size={12} className="animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search size={12} />
              Search
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 text-xs px-2 py-1.5 rounded-lg mb-2">
            {error}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-b border-gray-800">
        <button
          onClick={fetchAIRecommendations}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2
                    bg-purple-600/20 hover:bg-purple-600/30 border border-purple-800
                    text-purple-300 text-xs font-medium rounded-xl py-2 transition
                    disabled:opacity-50"
        >
          <Sparkles size={13} />
          {aiLoading ? 'Getting AI suggestions...' : ' AI Nearby Suggestions'}
        </button>
      </div>

      {/* AI Recommendations Panel */}
      {showAI && (
        <div className="border-b border-gray-800 bg-gray-900/50">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-purple-400 text-xs font-semibold flex items-center gap-1">
              <Sparkles size={11} />
              AI Recommendations
            </span>
            <button
              onClick={() => setShowAI(false)}
              className="text-gray-600 hover:text-gray-400 text-xs"
            >
              
            </button>
          </div>

          {aiLoading ? (
            <div className="px-3 pb-3 text-gray-500 text-xs text-center py-4">
               Analyzing nearby places...
            </div>
          ) : (
            <>
              {aiMessage && (
                <p className="px-3 pb-2 text-gray-400 text-xs leading-relaxed">
                  {aiMessage}
                </p>
              )}
              <div className="space-y-1 px-3 pb-3">
                {aiRecs.map((rec, i) => (
                  <div
                    key={i}
                    onClick={() => rec.placeId && router.push(`/places/${rec.placeId}`)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition
                              ${rec.priority === 'high'
                                ? 'border-purple-800 bg-purple-900/20 hover:bg-purple-900/30'
                                : 'border-gray-800 bg-gray-800/50 hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-xs font-medium">
                        {i + 1}. {rec.name}
                      </span>
                      {rec.priority === 'high' && (
                        <span className="text-purple-400 text-xs">⭐</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      {rec.reason}
                    </p>
                    {rec.distanceMeters && (
                      <span className="text-gray-600 text-xs">
                         {rec.distanceMeters < 1000
                          ? `${Math.round(Number(rec.distanceMeters))}m`
                          : `${(Number(rec.distanceMeters) / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {/* Category filters */}
      <div className="p-3 border-b border-gray-800 flex gap-2 overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            disabled={filtering}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full
                       capitalize transition font-medium disabled:opacity-50
                       ${activeCategory === cat
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between">
        <span className="text-gray-600 text-xs">
          {filtering ? 'Filtering...' : `${filteredPlaces.length} places within 3km`}
        </span>
        {search && (
          <span className="text-blue-400 text-xs">
            "{search}"
          </span>
        )}
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600 p-8">
            <MapPin size={28} className="mb-2 opacity-40" />
            <p className="text-xs text-center">No places found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-blue-400 text-xs mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredPlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => handlePlaceClick(place)}
              className={`p-4 border-b border-gray-800 cursor-pointer transition
                         hover:bg-gray-800
                         ${selectedPlace?.id === place.id
                           ? 'bg-gray-800 border-l-2 border-l-blue-500'
                           : ''}`}
            >
              {/* Name + category */}
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-white text-xs font-medium leading-tight flex-1 pr-2">
                  {place.name}
                </h3>
                <span className={`text-white text-xs px-1.5 py-0.5 rounded-full
                                  flex-shrink-0 ${categoryColors[place.category] || 'bg-gray-500'}`}
                      style={{ fontSize: '9px' }}>
                  {place.category}
                </span>
              </div>

              {/* Address */}
              {place.address && (
                <p className="text-gray-500 text-xs mb-2 leading-tight truncate">
                  {place.address}
                </p>
              )}

              {/* Rating + Distance + Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Star size={10} fill="currentColor" />
                    {Number(place.rating || 0).toFixed(1)}
                  </span>
                  {place.distance != null && (
                    <span className="text-gray-600 text-xs flex items-center gap-1">
                      <Navigation size={10} />
                      {place.distance < 1000
                        ? `${Math.round(Number(place.distance))}m`
                        : `${(Number(place.distance) / 1000).toFixed(1)}km`}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleViewDetail(e, place.id)}
                  className="text-blue-400 hover:text-blue-300 text-xs transition"
                >
                  Details -
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transit button */}
      {/* <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => router.push('/transit')}
          className="w-full flex items-center justify-center gap-2
                     bg-blue-600 hover:bg-blue-700 text-white text-sm
                     font-medium rounded-xl py-2.5 transition"
        >
          <Bus size={15} />
          View Transit Routes
        </button>
      </div> */}

    </div>
  )
}

export default Sidebar