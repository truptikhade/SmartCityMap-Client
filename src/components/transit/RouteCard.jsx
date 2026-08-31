'use client'
import { Bus, Train, Car, MapPin, Clock, IndianRupee, Map as MapIcon } from 'lucide-react'

const transitIcons = {
  bus:   <Bus   size={18} className="text-blue-400"   />,
  train: <Train size={18} className="text-green-400"  />,
  auto:  <Car   size={18} className="text-orange-400" />,
}

const transitColors = {
  bus:   'border-blue-800   bg-blue-950',
  train: 'border-green-800  bg-green-950',
  auto:  'border-orange-800 bg-orange-950',
}

export default function RouteCard({ route, onClick, onViewMap }) {
  return (
    <div
      onClick={onClick}
      className={`border rounded-2xl p-5 cursor-pointer
                  hover:opacity-80 transition
                  ${transitColors[route.transitType] || 'border-gray-800 bg-gray-900'}`}
    >
      {/* Route name + type */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {transitIcons[route.transitType]}
          <span className="text-white font-semibold text-sm">
            {route.routeName}
          </span>
          <span className="text-gray-500 text-xs">
            #{route.routeNumber}
          </span>
        </div>
        <span className="text-xs text-gray-400 capitalize bg-gray-800
                         px-2 py-1 rounded-full">
          {route.transitType}
        </span>
      </div>

      {/* Origin → Destination */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={13} className="text-green-400 flex-shrink-0" />
        <span className="text-gray-300 text-sm">{route.origin}</span>
        <span className="text-gray-600">→</span>
        <MapPin size={13} className="text-red-400 flex-shrink-0" />
        <span className="text-gray-300 text-sm">{route.destination}</span>
      </div>

      {/* Fare + timing */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <IndianRupee size={11} />
          {route.baseFare}
        </span>
        {route.firstDeparture && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            First: {route.firstDeparture}
          </span>
        )}
        {route.lastDeparture && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Last: {route.lastDeparture}
          </span>
        )}
      </div>

      {/* View on map */}
      {onViewMap && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewMap(route)
          }}
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300
                     text-xs font-medium transition"
        >
          <MapIcon size={13} />
          View Route on Map
        </button>
      )}
    </div>
  )
}