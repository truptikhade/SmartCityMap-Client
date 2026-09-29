'use client'

import {
  Car,
  LogOut,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { useRouter } from 'next/navigation'

import toast from 'react-hot-toast'

import { useAuth } from '../../hooks/useAuth'

export default function DriverHeader({
  driver,
  socketConnected,
  onRefresh,
  refreshing,
}) {
  const router = useRouter()

  const { logout } = useAuth()

  const firstName =
    driver?.user?.fname ||
    driver?.fname ||
    'Driver'

  const lastName =
    driver?.user?.lname ||
    driver?.lname ||
    ''

  const vehicle =
    driver?.vehicles?.find(
      (item) =>
        item.isActive &&
        item.approvalStatus ===
          'APPROVED'
    ) ||
    driver?.vehicles?.find(
      (item) =>
        item.isActive
    ) ||
    driver?.vehicles?.[0] ||
    null

  const vehicleName = [
    vehicle?.brand,
    vehicle?.model,
  ]
    .filter(Boolean)
    .join(' ')

  const handleLogout = () => {
    logout()

    toast.success(
      'Logged out'
    )

    router.replace('/login')
  }

  return (
    <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">

        {/* Identity */}

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-xl font-semibold text-slate-900">
                Welcome, {firstName}{' '}
                {lastName}
              </h1>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Driver
              </span>

            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">

              {vehicle && (
                <span className="flex items-center gap-1.5">
                  <Car size={15} />

                  {vehicle.vehicleNumber}
                </span>
              )}

              {vehicleName && (
                <span>
                  {vehicleName}
                </span>
              )}

              {vehicle?.vehicleType && (
                <span className="capitalize">
                  {vehicle.vehicleType}
                </span>
              )}

            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs">

              {socketConnected ? (
                <>
                  <Wifi
                    size={14}
                    className="text-emerald-600"
                  />

                  <span className="text-emerald-600">
                    Live connection active
                  </span>
                </>
              ) : (
                <>
                  <WifiOff
                    size={14}
                    className="text-slate-400"
                  />

                  <span className="text-slate-500">
                    Live service disconnected
                  </span>
                </>
              )}

            </div>

          </div>

        </div>

        {/* Actions */}

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/driver/profile'
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Settings size={16} />

            <span>
              Profile & Vehicle
            </span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            <span>
              {refreshing
                ? 'Refreshing...'
                : 'Refresh'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>

        </div>

      </div>

    </header>
  )
}