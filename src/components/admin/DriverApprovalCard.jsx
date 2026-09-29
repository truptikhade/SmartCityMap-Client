'use client'

import {
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Phone,
  XCircle,
} from 'lucide-react'

export default function DriverApprovalCard({
  driver,
  onApprove,
  onReject,
  actionLoading,
}) {
  if (!driver) {
    return null
  }

  const user = driver.user || {}

  const vehicle =
    driver.vehicles?.find(
      (item) => item.isActive
    ) ||
    driver.vehicles?.[0] ||
    null

  const fullName =
    `${user.fname || ''} ${user.lname || ''}`.trim() ||
    'Unknown Driver'

  const isApproved =
    Boolean(driver.isApproved)

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

      {/* ------------------------------------------
          Driver information
      ------------------------------------------ */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div className="flex items-start gap-4">

          {/* Avatar */}

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-lg font-semibold text-white">
            {user.fname?.[0]?.toUpperCase() ||
              'D'}
          </div>

          {/* Basic information */}

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="text-base font-semibold text-white">
                {fullName}
              </h3>

              {isApproved ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-800 bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
                  <CheckCircle2 size={12} />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-yellow-800 bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-400">
                  <Clock3 size={12} />
                  Pending
                </span>
              )}

            </div>

            <div className="mt-2 space-y-1.5 text-sm text-gray-400">

              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  {user.email}
                </div>
              )}

              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  {user.phone}
                </div>
              )}

            </div>

          </div>

        </div>

        {/* ------------------------------------------
            Action buttons
        ------------------------------------------ */}

        <div className="flex shrink-0 gap-2">

          {!isApproved ? (
            <button
              type="button"
              onClick={() =>
                onApprove(driver.id)
              }
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={16} />

              {actionLoading
                ? 'Processing...'
                : 'Approve'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                onReject(driver.id)
              }
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle size={16} />

              {actionLoading
                ? 'Processing...'
                : 'Reject'}
            </button>
          )}

        </div>

      </div>

      {/* ------------------------------------------
          Driver details
      ------------------------------------------ */}

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-800 pt-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* License */}

        <div className="rounded-xl bg-gray-950 p-3">

          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
            <FileText size={13} />
            License Number
          </div>

          <p className="text-sm font-medium text-white">
            {driver.licenseNumber ||
              'Not provided'}
          </p>

        </div>

        {/* Vehicle */}

        <div className="rounded-xl bg-gray-950 p-3">

          <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
            <Car size={13} />
            Vehicle
          </div>

          <p className="text-sm font-medium text-white">
            {vehicle?.vehicleNumber ||
              'Not provided'}
          </p>

        </div>

        {/* Vehicle type */}

        <div className="rounded-xl bg-gray-950 p-3">

          <div className="mb-1 text-xs text-gray-500">
            Vehicle Type
          </div>

          <p className="text-sm font-medium capitalize text-white">
            {vehicle?.vehicleType ||
              'Not provided'}
          </p>

        </div>

        {/* Vehicle model */}

        <div className="rounded-xl bg-gray-950 p-3">

          <div className="mb-1 text-xs text-gray-500">
            Vehicle Model
          </div>

          <p className="text-sm font-medium text-white">

            {[
              vehicle?.brand,
              vehicle?.model,
            ]
              .filter(Boolean)
              .join(' ') ||
              'Not provided'}

          </p>

        </div>

      </div>

      {/* ------------------------------------------
          Availability
      ------------------------------------------ */}

      <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-4">

        <span className="text-xs text-gray-500">
          Current availability
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            driver.isAvailable
              ? 'bg-green-900/30 text-green-400'
              : 'bg-gray-800 text-gray-500'
          }`}
        >
          {driver.isAvailable
            ? 'Online'
            : 'Offline'}
        </span>

      </div>

    </div>
  )
}