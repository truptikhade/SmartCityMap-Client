'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter }                from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedPlace }         from '../../store/mapSlice'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const createIcon = (color) => new L.Icon({
  iconUrl:     `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  iconSize:    [20, 33],
  iconAnchor:  [10, 33],
  popupAnchor: [1, -28],
  shadowUrl:   'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize:  [33, 33],
})

const userIcon  = createIcon('blue')
const placeIcon = createIcon('red')
const busIcon   = createIcon('green')
const stopIcon  = createIcon('gold')

const MapUpdater = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    if (center && map) {
      try {
        map.setView(center, 14)
      } catch (err) {
        console.error('Error updating map view:', err)
      }
    }
  }, [center, map])
  return null
}

// Fits the map to show the whole route when an active route is set
const RouteFitter = ({ stops }) => {
  const map = useMap()
  useEffect(() => {
    if (!stops || stops.length === 0) return
    try {
      const bounds = stops.map((s) => [s.lat, s.lng])
      map.fitBounds(bounds, { padding: [40, 40] })
    } catch (err) {
      console.error('Error fitting route bounds:', err)
    }
  }, [stops, map])
  return null
}

// Fetches the actual road-following path between route stops via OSRM
// (for bus/auto routes), falling back to a straight line if routing fails
const RoutePath = ({ stops }) => {
  const [pathCoords, setPathCoords] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!stops || stops.length < 2) return

    setPathCoords(null)
    setFailed(false)

    const coordsParam = stops.map((s) => `${s.lng},${s.lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`OSRM error ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const coords = data?.routes?.[0]?.geometry?.coordinates
        if (!coords || coords.length === 0) throw new Error('No route geometry')
        // OSRM returns [lng, lat] — Leaflet wants [lat, lng]
        setPathCoords(coords.map(([lng, lat]) => [lat, lng]))
      })
      .catch((err) => {
        if (err.name === 'AbortError') return // expected cleanup, not a real failure
        console.error('OSRM routing failed, falling back to straight line:', err.message)
        setFailed(true)
      })
      .finally(() => clearTimeout(timeoutId))

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [stops])

  const positions = pathCoords || (failed ? stops.map((s) => [s.lat, s.lng]) : null)

  if (!positions) return null

  return (
    <Polyline
      positions={positions}
      pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
    />
  )
}

// Fetches actual rail track geometry near the route from OpenStreetMap (via Overpass)
// for train routes. Shows real track corridors rather than a road path or straight line.
const TrainRoutePath = ({ stops }) => {
  const [trackCoords, setTrackCoords] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!stops || stops.length < 2) return

    setTrackCoords(null)
    setFailed(false)

    const lats = stops.map((s) => s.lat)
    const lngs = stops.map((s) => s.lng)
    const pad = 0.05 // ~5km buffer around the route's bounding box
    const south = Math.min(...lats) - pad
    const north = Math.max(...lats) + pad
    const west  = Math.min(...lngs) - pad
    const east  = Math.max(...lngs) + pad

    const query = `[out:json][timeout:25];
      way["railway"="rail"](${south},${west},${north},${east});
      out geom;`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    fetch('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept':       'application/json',
        'User-Agent':   'SmartCityMap/1.0 (development)',
      },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Overpass error ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const ways = data?.elements?.filter((el) => el.type === 'way' && el.geometry)
        if (!ways || ways.length === 0) throw new Error('No rail tracks found nearby')

        // Convert each way's geometry into a Leaflet-friendly [lat, lng][] segment
        const segments = ways.map((way) =>
          way.geometry.map((pt) => [pt.lat, pt.lon])
        )
        setTrackCoords(segments)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error('Rail track fetch failed, falling back to straight line:', err.message)
        setFailed(true)
      })
      .finally(() => clearTimeout(timeoutId))

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [stops])

  if (failed) {
    return (
      <Polyline
        positions={stops.map((s) => [s.lat, s.lng])}
        pathOptions={{ color: '#16a34a', weight: 4, opacity: 0.8, dashArray: '6 6' }}
      />
    )
  }

  if (!trackCoords) return null

  // Render every rail segment found in the bounding box
  return trackCoords.map((segment, i) => (
    <Polyline
      key={i}
      positions={segment}
      pathOptions={{ color: '#16a34a', weight: 3, opacity: 0.7 }}
    />
  ))
}

export default function MapView() {
  const router        = useRouter()
  const dispatch      = useDispatch()
  const userLocation  = useSelector((state) => state.map.userLocation)
  const nearbyPlaces  = useSelector((state) => state.map.nearbyPlaces)
  const liveBuses     = useSelector((state) => state.map.liveBuses)
  const activeRoute   = useSelector((state) => state.map.activeRoute)
  const mapRef        = useRef(null)

  const defaultCenter = [19.9975, 73.7898]
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current._leaflet_map?.remove?.()
        mapRef.current.remove?.()
      }
    }
  }, [])

  const hasUserLocation = !!userLocation
  const mapKey = `map-${hasUserLocation ? 'user-location' : 'default-location'}`

  const routeStops = activeRoute?.stops
    ? [...activeRoute.stops].sort((a, b) => a.stopOrder - b.stopOrder)
    : []

  return (
    <MapContainer
      key={mapKey}
      ref={mapRef}
      center={center}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        key="tile-layer"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div style={{ textAlign: 'center', padding: '4px' }}>
              <strong>📍 You are here</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {nearbyPlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={placeIcon}
          eventHandlers={{ click: () => dispatch(setSelectedPlace(place)) }}
        >
          <Popup minWidth={200}>
            <PlacePopupContent
              place={place}
              onViewDetail={() => router.push(`/places/${place.id}`)}
            />
          </Popup>
        </Marker>
      ))}

      {/* Live bus markers */}
      {Object.entries(liveBuses).map(([tripId, pos]) => (
        <Marker
          key={tripId}
          position={[pos.lat, pos.lng]}
          icon={busIcon}
        >
          <Popup>
            <div style={{ minWidth: '160px' }}>
              <strong>🚌 Live Bus</strong><br/>
              <span style={{ fontSize: '11px', color: '#666' }}>
                Trip: {tripId.slice(0, 8)}...
              </span><br/>
              {pos.currentStop && (
                <span style={{ fontSize: '11px' }}>
                  📍 At: {pos.currentStop}
                </span>
              )}
              {pos.nextStop && (
                <>
                  <br/>
                  <span style={{ fontSize: '11px', color: '#2563eb' }}>
                    ➡ Next: {pos.nextStop}
                  </span>
                </>
              )}
              {pos.speedKmph && (
                <>
                  <br/>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    🚀 {pos.speedKmph} km/h
                  </span>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Active route path */}
      {routeStops.length > 0 && (
        <>
          <RouteFitter stops={routeStops} />

          {activeRoute?.transitType === 'train' ? (
            <TrainRoutePath stops={routeStops} />
          ) : (
            <RoutePath stops={routeStops} />
          )}

          {routeStops.map((stop, index) => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={index === 0 || index === routeStops.length - 1 ? placeIcon : stopIcon}
            >
              <Popup>
                <strong>{stop.stopName}</strong>
                {stop.arrivalTime && <><br />{stop.arrivalTime}</>}
              </Popup>
            </Marker>
          ))}
        </>
      )}
    </MapContainer>
  )
}

function PlacePopupContent({ place, onViewDetail }) {
  const categoryEmojis = {
    hospital: '🏥', restaurant: '🍽️', market: '🛒', temple: '🛕',
    atm: '🏧', pharmacy: '💊', school: '🏫', other: '📍',
  }

  return (
    <div style={{ minWidth: '180px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>
          {categoryEmojis[place.category] || '📍'} {place.name}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{
          fontSize: '10px', padding: '2px 6px',
          background: '#3b82f6', color: '#fff',
          borderRadius: '99px', textTransform: 'capitalize'
        }}>
          {place.category}
        </span>
        <span style={{ fontSize: '11px', color: '#f59e0b' }}>
          ⭐ {Number(place.rating || 0).toFixed(1)}
        </span>
      </div>

      {place.address && (
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
          📍 {place.address}
        </p>
      )}

      {place.distance != null && (
        <p style={{ fontSize: '11px', color: '#888', marginBottom: '10px' }}>
          🚶 {place.distance < 1000
            ? `${Math.round(Number(place.distance))}m away`
            : `${(Number(place.distance) / 1000).toFixed(1)}km away`}
        </p>
      )}

      <div style={{ height: '1px', background: '#e5e7eb', marginBottom: '10px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={onViewDetail}
          style={{
            width: '100%', padding: '7px 12px', background: '#2563eb',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          📋 View Details & Reviews
        </button>

        <button
          onClick={() => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
            window.open(url, '_blank')
          }}
          style={{
            width: '100%', padding: '7px 12px', background: '#f3f4f6',
            color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}
        >
          🗺️ Get Directions
        </button>
      </div>
    </div>
  )
}