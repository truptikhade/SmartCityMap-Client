'use client'

import { ArrowRight, Bus, Car, Clock3, TrainFront, Users } from 'lucide-react'

const icons = {
  bus: Bus,
  train: TrainFront,
  auto: Car,
}

export default function TripCard({ trip, transitType = 'bus', onClick }) {
  const Icon = icons[transitType] || Bus

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{trip.departureTime}</span>
            {trip.arrivalTime && (
              <>
                <ArrowRight size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">{trip.arrivalTime}</span>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock3 size={12} />{trip.status}</span>
            <span className="flex items-center gap-1"><Users size={12} />{trip.availableSeats} seats</span>
            {trip.vehicleNumber && <span>{trip.vehicleNumber}</span>}
          </div>
        </div>

        <ArrowRight size={17} className="text-gray-400" />
      </div>
    </button>
  )
}
