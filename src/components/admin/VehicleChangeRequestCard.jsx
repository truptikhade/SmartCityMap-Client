'use client'

import {
  Check,
  CarFront,
  Clock3,
  Loader2,
  Mail,
  Phone,
  X,
} from 'lucide-react'

export default function VehicleChangeRequestCard({
  request,
  onApprove,
  onReject,
  actionLoading = false,
}) {
  if (!request) {
    return null
  }

  const driver = request.driver
  const user = driver?.user

  const currentVehicle =
    request.currentVehicle

  const requestedVehicle =
    request.requestedVehicle

  return (
    <article className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800">
              <CarFront
                size={19}
                className="text-gray-300"
              />
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Vehicle change request
              </h3>

              <p className="text-sm text-gray-500">
                {user?.fname}{' '}
                {user?.lname || ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-900/60 bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-400">
          <Clock3 size={13} />

          Pending review
        </div>
      </div>

      {/* Driver information */}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Driver
          </p>

          <p className="mt-2 text-sm font-medium text-white">
            {user?.fname}{' '}
            {user?.lname || ''}
          </p>

          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Mail size={13} />
              {user?.email}
            </div>

            <div className="flex items-center gap-2">
              <Phone size={13} />
              {user?.phone}
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            License:{' '}
            <span className="text-gray-300">
              {driver?.licenseNumber ||
                'Not available'}
            </span>
          </p>
        </div>

        {/* Current */}

        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Current vehicle
          </p>

          <div className="mt-2 space-y-1 text-sm">
            <p className="font-semibold text-white">
              {currentVehicle?.vehicleNumber ||
                '—'}
            </p>

            <p className="text-gray-400">
              {currentVehicle?.vehicleType ||
                '—'}
            </p>

            <p className="text-gray-500">
              {[
                currentVehicle?.brand,
                currentVehicle?.model,
                currentVehicle?.color,
              ]
                .filter(Boolean)
                .join(' • ') ||
                'No additional details'}
            </p>
          </div>
        </div>
      </div>

      {/* Requested change */}

      <div className="mt-4 rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
        <p className="text-xs uppercase tracking-wide text-blue-400">
          Requested vehicle details
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">
              Number
            </p>

            <p className="mt-1 text-sm font-medium text-white">
              {requestedVehicle?.vehicleNumber ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Type
            </p>

            <p className="mt-1 text-sm text-gray-300">
              {requestedVehicle?.vehicleType ||
                '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Brand / Model
            </p>

            <p className="mt-1 text-sm text-gray-300">
              {[
                requestedVehicle?.brand,
                requestedVehicle?.model,
              ]
                .filter(Boolean)
                .join(' ') || '—'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Color
            </p>

            <p className="mt-1 text-sm text-gray-300">
              {requestedVehicle?.color ||
                '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            onReject(request.id)
          }
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <X size={16} />
          )}

          Reject
        </button>

        <button
          type="button"
          onClick={() =>
            onApprove(request.id)
          }
          disabled={actionLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLoading ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <Check size={16} />
          )}

          Approve change
        </button>
      </div>
    </article>
  )
}