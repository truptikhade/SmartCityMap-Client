'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownUp, Clock3, Loader2, MapPin, LocateFixed } from 'lucide-react'
import toast from 'react-hot-toast'
import { searchJourneyAPI } from '../../api/transit.api'

const RECENT_SEARCHES_KEY = 'smartcity_recent_searches'
const MAX_RECENT_SEARCHES = 5

// ======================================================
// NOMINATIM SEARCH
// ======================================================
const nominatimSearch = async (query) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(
      query
    )}`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Location search failed')
  }

  return response.json()
}

// ======================================================
// REVERSE GEOCODING
// ======================================================
const reverseGeocode = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(
      lng
    )}&zoom=18&addressdetails=1&accept-language=en`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Reverse geocoding failed')
  }

  return response.json()
}

// ======================================================
// COMPONENT
// ======================================================
export default function JourneySearch({
  onSearch,
  onClear,
  initialFrom = '',
  initialTo = '',
  currentLocation = null,
}) {
  // ====================================================
  // STATE
  // ====================================================
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [fromResults, setFromResults] = useState([])
  const [toResults, setToResults] = useState([])
  const [fromPlace, setFromPlace] = useState(null)
  const [toPlace, setToPlace] = useState(null)
  const [currentLocationPlace, setCurrentLocationPlace] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchingField, setSearchingField] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [activeField, setActiveField] = useState(null)
  const [resolvingCurrentLocation, setResolvingCurrentLocation] = useState(false)

  const containerRef = useRef(null)
  const currentLocationInitialized = useRef(false)

  // ====================================================
  // LOAD RECENT SEARCHES
  // ====================================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed)
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  // ====================================================
  // CURRENT LOCATION FOR DROPDOWN ONLY
  // ====================================================
  useEffect(() => {
    if (!currentLocation) return

    const lat = Number(currentLocation.lat)
    const lng = Number(currentLocation.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const loadCurrentLocation = async () => {
      try {
        setResolvingCurrentLocation(true)
        const result = await reverseGeocode(lat, lng)
        const name =
          result?.display_name?.split(',').slice(0, 2).join(',').trim() ||
          'Your current location'

        setCurrentLocationPlace({
          name,
          lat,
          lng,
          isCurrentLocation: true,
        })
      } catch (error) {
        console.error('Current location reverse geocoding error:', error)
        setCurrentLocationPlace({
          name: 'Your current location',
          lat,
          lng,
          isCurrentLocation: true,
        })
      } finally {
        setResolvingCurrentLocation(false)
      }
    }

    loadCurrentLocation()
  }, [currentLocation])

  // ====================================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ====================================================
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowRecentSearches(false)
        setFromResults([])
        setToResults([])
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  // ====================================================
  // SEARCH LOCATION
  // ====================================================
  const searchLocation = async (value, field) => {
    if (value.trim().length < 3) {
      if (field === 'from') {
        setFromResults([])
      } else {
        setToResults([])
      }
      return
    }

    setSearchingField(field)
    try {
      const results = await nominatimSearch(value)
      if (field === 'from') {
        setFromResults(results)
      } else {
        setToResults(results)
      }
    } catch (error) {
      console.error('Location search error:', error)
      toast.error('Could not search that location')
    } finally {
      setSearchingField(null)
    }
  }

  // ====================================================
  // SELECT NOMINATIM PLACE
  // ====================================================
  const selectPlace = (place, field) => {
    const selected = {
      name: place.display_name.split(',').slice(0, 2).join(',').trim(),
      lat: Number(place.lat),
      lng: Number(place.lon),
    }

    if (field === 'from') {
      setFrom(selected.name)
      setFromPlace(selected)
      setFromResults([])
    } else {
      setTo(selected.name)
      setToPlace(selected)
      setToResults([])
    }

    setShowRecentSearches(false)
  }

  // ====================================================
  // SAVE RECENT SEARCH
  // ====================================================
  const saveRecentSearch = (origin, destination) => {
    if (!origin || !destination) return

    const newSearch = {
      id: [
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng,
      ].join('-'),
      from: {
        name: origin.name,
        lat: origin.lat,
        lng: origin.lng,
      },
      to: {
        name: destination.name,
        lat: destination.lat,
        lng: destination.lng,
      },
      createdAt: Date.now(),
    }

    const existing = recentSearches.filter((item) => item.id !== newSearch.id)
    const updated = [newSearch, ...existing].slice(0, MAX_RECENT_SEARCHES)

    setRecentSearches(updated)

    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }

  // ====================================================
  // SELECT RECENT SEARCH
  // ====================================================
  const handleRecentSearch = (recent) => {
    if (!recent?.from || !recent?.to) return

    setFrom(recent.from.name)
    setTo(recent.to.name)
    setFromPlace(recent.from)
    setToPlace(recent.to)
    setFromResults([])
    setToResults([])
    setShowRecentSearches(false)
  }

  // ====================================================
  // SWAP
  // ====================================================
  const swap = () => {
    const oldFrom = from
    const oldTo = to
    const oldFromPlace = fromPlace
    const oldToPlace = toPlace

    setFrom(oldTo)
    setTo(oldFrom)
    setFromPlace(oldToPlace)
    setToPlace(oldFromPlace)
    setFromResults([])
    setToResults([])
    setShowRecentSearches(false)
  }

  // ====================================================
  // CLEAR
  // ====================================================
  const handleClear = () => {
    setFrom('')
    setTo('')
    setFromPlace(null)
    setToPlace(null)
    setFromResults([])
    setToResults([])
    setShowRecentSearches(false)
    currentLocationInitialized.current = false
    onClear?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setShowRecentSearches(false)

    if (!fromPlace || !toPlace) {
      toast.error('Select both origin and destination from the suggestions')
      return
    }

    if (
      !Number.isFinite(Number(fromPlace.lat)) ||
      !Number.isFinite(Number(fromPlace.lng)) ||
      !Number.isFinite(Number(toPlace.lat)) ||
      !Number.isFinite(Number(toPlace.lng))
    ) {
      toast.error('Please select valid locations')
      return
    }

    if (
      Number(fromPlace.lat) === Number(toPlace.lat) &&
      Number(fromPlace.lng) === Number(toPlace.lng)
    ) {
      toast.error('Origin and destination must be different')
      return
    }

    setLoading(true)

    try {
      const travelDate = new Date().toISOString().split('T')[0]
      const response = await searchJourneyAPI({
        fromLat: Number(fromPlace.lat),
        fromLng: Number(fromPlace.lng),
        toLat: Number(toPlace.lat),
        toLng: Number(toPlace.lng),
        date: travelDate,
      })

      const journeyData = {
        ...response.data.data,
        from: fromPlace,
        to: toPlace,
        travelDate,
      }

      saveRecentSearch(fromPlace, toPlace)
      onSearch?.(journeyData)
    } catch (error) {
      console.error('Journey search error:', error)
      toast.error(error?.response?.data?.message || 'Could not find a route')
    } finally {
      setLoading(false)
    }
  }

  // ====================================================
  // RENDER NOMINATIM RESULTS
  // ====================================================
  const renderResults = (results, field) => {
    if (!results || results.length === 0) return null

    return (
      <div className="absolute left-0 right-0 top-full z-[3000] mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        {results.map((place, index) => (
          <button
            key={place.place_id || `${field}-${place.lat}-${place.lon}-${index}`}
            type="button"
            onClick={() => selectPlace(place, field)}
            className="flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left text-gray-900 last:border-0 hover:bg-gray-50"
          >
            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
            <span className="line-clamp-2 text-sm leading-5 text-gray-800">
              {place.display_name}
            </span>
          </button>
        ))}
      </div>
    )
  }

  // ====================================================
  // RECENT SEARCHES
  // ====================================================
  const renderRecentSearches = () => {
    const hasCurrentLocation =
      currentLocation &&
      Number.isFinite(Number(currentLocation.lat)) &&
      Number.isFinite(Number(currentLocation.lng))

    const showCurrentLocation =
      (activeField === 'from' || activeField === 'to') && hasCurrentLocation

    if (!showCurrentLocation && recentSearches.length === 0) return null

    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock3 size={15} className="text-gray-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent searches
            </span>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {showCurrentLocation && (
            <button
              type="button"
              onClick={() => handleCurrentLocation(activeField)}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <LocateFixed size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  Current location
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {currentLocationPlace?.name || 'Your current location'}
                </p>
              </div>
            </button>
          )}

          {recentSearches.map((recent, index) => (
            <button
              key={
                recent.id ||
                `${recent.from?.lat}-${recent.from?.lng}-${recent.to?.lat}-${recent.to?.lng}-${index}`
              }
              type="button"
              onClick={() => handleRecentSearch(recent)}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-0 hover:bg-gray-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <Clock3 size={16} className="text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {recent.from?.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <span>to</span>
                  <span className="truncate">{recent.to?.name}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const handleCurrentLocation = (field) => {
    if (!currentLocation) return

    const lat = Number(currentLocation.lat)
    const lng = Number(currentLocation.lng)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const selected = {
      ...(currentLocationPlace || {}),
      name: currentLocationPlace?.name || 'Your current location',
      lat,
      lng,
      isCurrentLocation: true,
    }

    setCurrentLocationPlace(selected)

    if (field === 'to') {
      setTo(selected.name)
      setToPlace(selected)
      setToResults([])
    } else {
      setFrom(selected.name)
      setFromPlace(selected)
      setFromResults([])
    }

    setActiveField(field)
    currentLocationInitialized.current = true
    setShowRecentSearches(false)
  }

  // ====================================================
  // RENDER
  // ====================================================
  return (
    <form ref={containerRef} onSubmit={handleSubmit} className="w-full">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {/* FROM / SWAP / TO */}
        <div className="relative">
          {/* FROM */}
          <div className="relative z-20">
            <MapPin
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 z-10 text-green-600"
            />
            <input
              type="text"
              value={from}
              onChange={(event) => {
                const value = event.target.value
                setFrom(value)
                setFromPlace(null)
                currentLocationInitialized.current = true
                setActiveField('from')
                setShowRecentSearches(false)
                searchLocation(value, 'from')
              }}
              onFocus={() => {
                setActiveField('from')
                const hasCurrentLocation =
                  currentLocation &&
                  Number.isFinite(Number(currentLocation.lat)) &&
                  Number.isFinite(Number(currentLocation.lng))

                if (hasCurrentLocation || recentSearches.length > 0) {
                  setShowRecentSearches(true)
                }
              }}
              placeholder={
             'From'
              }
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          
            {fromResults.length > 0 && renderResults(fromResults, 'from')}
          </div>

          {/* SWAP */}
          <div className="relative flex h-15 items-center justify-end">
            <div className="pointer-events-none absolute left-[22px] top-0 h-full border-l border-dashed border-gray-300" />
            <button
              type="button"
              onClick={swap}
              disabled={!from && !to}
              className="absolute left-2 top-1/2 z-30 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-amber-200 text-gray-900 shadow-sm transition hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Swap starting point and destination"
              title="Reverse starting point and destination"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          {/* TO */}
          <div className="relative z-10">
            <MapPin
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 z-10 text-red-500"
            />
            <input
              type="text"
              value={to}
              onChange={(event) => {
                const value = event.target.value
                setTo(value)
                setToPlace(null)
                setActiveField('to')
                setShowRecentSearches(false)
                searchLocation(value, 'to')
              }}
              onFocus={() => {
                setActiveField('to')
                const hasCurrentLocation =
                  currentLocation &&
                  Number.isFinite(Number(currentLocation.lat)) &&
                  Number.isFinite(Number(currentLocation.lng))

                if (hasCurrentLocation || recentSearches.length > 0) {
                  setShowRecentSearches(true)
                }
              }}
              placeholder="To"
              autoComplete="off"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:bg-white"
            />
            {searchingField === 'to' && (
              <Loader2
                size={15}
                className="absolute right-3 top-3.5 animate-spin text-gray-500"
              />
            )}
            {toResults.length > 0 && renderResults(toResults, 'to')}
          </div>

          {/* RECENT SEARCHES */}
          {showRecentSearches &&
            (recentSearches.length > 0 ||
              ((activeField === 'from' || activeField === 'to') &&
                currentLocation &&
                Number.isFinite(Number(currentLocation.lat)) &&
                Number.isFinite(Number(currentLocation.lng)))) && (
              <div className="absolute left-0 right-0 top-full z-[2500] mt-2">
                {renderRecentSearches()}
              </div>
            )}
        </div>

        {/* SEARCH */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Finding route...' : 'Search route'}
        </button>

        {/* CLEAR */}
        {(from || to) && (
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            Clear route
          </button>
        )}
      </div>
    </form>
  )
}