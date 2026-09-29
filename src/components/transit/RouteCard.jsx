'use client'

import { Bus, Car, Clock3, IndianRupee, MapPin, TrainFront } from 'lucide-react'

const icons = { bus: Bus, train: TrainFront, auto: Car }

export default function RouteCard({ route, onClick, onViewMap }) {
  const Icon = icons[route.transitType] || Bus

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <Icon size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{route.routeName}</h3>
              <span className="text-xs text-gray-400">#{route.routeNumber}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <MapPin size={13} className="text-green-600" />
              {route.origin}
              <span className="text-gray-300">to</span>
              {route.destination}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><IndianRupee size={12} />{route.baseFare}</span>
          {route.firstDeparture && <span className="flex items-center gap-1"><Clock3 size={12} />First {route.firstDeparture}</span>}
          {route.lastDeparture && <span>Last {route.lastDeparture}</span>}
        </div>
      </button>

      {onViewMap && (
        <button type="button" onClick={() => onViewMap(route)} className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700">
          View on map
        </button>
      )}
    </div>
  )
}
