'use client'

import {
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Route,
  XCircle,
} from 'lucide-react'

export default function DriverRideHistory({
  rides = [],
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Recent trips
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Your latest ride activity.
        </p>
      </div>

      {rides.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Route
            size={28}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 font-medium text-slate-800">
            No trips yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Completed rides will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {rides.map((ride) => (
              <RideHistoryItem
                key={ride.id}
                ride={ride}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function RideHistoryItem({
  ride,
}) {
  const pickup =
    ride.pickup?.address ||
    'Pickup location'

  const destination =
    ride.destination?.address ||
    'Destination'

  const status =
    ride.status

  const isCompleted =
    status === 'COMPLETED'

  const isCancelled =
    status === 'CANCELLED'

  const date =
    ride.requestedAt ||
    ride.createdAt

  return (
    <div className="px-5 py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* Route */}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex flex-col items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <span className="my-1 h-7 w-px bg-slate-200" />

              <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
            </div>

            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <div className="mt-1 flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <p className="truncate text-sm font-medium text-slate-800">
                    {pickup}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Destination
                </p>

                <div className="mt-1 flex items-start gap-2">
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <p className="truncate text-sm font-medium text-slate-800">
                    {destination}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}

        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-xs text-slate-400">
              Fare
            </p>

            <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
              <IndianRupee
                size={14}
              />

              {isCompleted
                ? Number(
                    ride.finalFare ||
                      ride.estimatedFare ||
                      0
                  ).toFixed(0)
                : Number(
                    ride.estimatedFare ||
                      0
                  ).toFixed(0)}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Distance
            </p>

            <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
              <Route
                size={14}
              />

              {Number(
                ride.distanceKm ||
                  0
              ).toFixed(1)}
              km
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Date
            </p>

            <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-700">
              <Clock3
                size={14}
              />

              {formatDate(date)}
            </div>
          </div>

          <StatusBadge
            status={status}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  status,
}) {
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2
          size={13}
        />

        Completed
      </span>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <XCircle
          size={13}
        />

        Cancelled
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
      <Clock3
        size={13}
      />

      {formatStatus(status)}
    </span>
  )
}

function formatStatus(status) {
  if (!status) {
    return 'Unknown'
  }

  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    )
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '—'
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}