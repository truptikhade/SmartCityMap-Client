'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useRouter } from 'next/navigation'

import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'

import toast from 'react-hot-toast'

import { useAuth } from '../../hooks/useAuth'

import {
  getAllDriversAPI,
  approveDriverAPI,
  rejectDriverAPI,
  getPendingVehicleChangeRequestsAPI,
  approveVehicleChangeRequestAPI,
  rejectVehicleChangeRequestAPI,
} from '../../api/admin.api'

import AdminHeader from './AdminHeader'
import DriverApprovalCard from './DriverApprovalCard'
import VehicleChangeRequestCard from './VehicleChangeRequestCard'

export default function AdminDashboard() {
  const router = useRouter()

  const {
    user,
    isAuthenticated,
    loading: authLoading,
    logout,
  } = useAuth()

  const [drivers, setDrivers] =
    useState([])

  const [
    vehicleRequests,
    setVehicleRequests,
  ] = useState([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [
    actionDriverId,
    setActionDriverId,
  ] = useState(null)

  const [
    actionRequestId,
    setActionRequestId,
  ] = useState(null)

  // --------------------------------------------------
  // Load drivers
  // --------------------------------------------------

  const loadDrivers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        const response =
          await getAllDriversAPI()

        const data =
          response?.data || response

        setDrivers(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (error) {
        console.error(
          'Admin drivers error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load drivers'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  // --------------------------------------------------
  // Load vehicle change requests
  // --------------------------------------------------

  const loadVehicleRequests =
    useCallback(async () => {
      try {
        const response =
          await getPendingVehicleChangeRequestsAPI()

        const data =
          response?.data || response

        setVehicleRequests(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (error) {
        console.error(
          'Vehicle requests error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load vehicle change requests'
        )
      }
    }, [])

  // --------------------------------------------------
  // Initial authentication/load
  // --------------------------------------------------

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user?.role !== 'admin') {
      if (user?.role === 'driver') {
        router.replace('/driver')
      } else {
        router.replace('/')
      }

      return
    }

    loadDrivers()
    loadVehicleRequests()
  }, [
    authLoading,
    isAuthenticated,
    user?.role,
    router,
    loadDrivers,
    loadVehicleRequests,
  ])

  // --------------------------------------------------
  // Approve driver
  // --------------------------------------------------

  const handleApprove = async (
    driverId
  ) => {
    try {
      setActionDriverId(driverId)

      await approveDriverAPI(
        driverId
      )

      toast.success(
        'Driver approved successfully'
      )

      await loadDrivers(true)
    } catch (error) {
      console.error(
        'Approve driver error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to approve driver'
      )
    } finally {
      setActionDriverId(null)
    }
  }

  // --------------------------------------------------
  // Reject driver
  // --------------------------------------------------

  const handleReject = async (
    driverId
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to reject this driver?'
      )

    if (!confirmed) {
      return
    }

    try {
      setActionDriverId(driverId)

      await rejectDriverAPI(
        driverId
      )

      toast.success(
        'Driver rejected'
      )

      await loadDrivers(true)
    } catch (error) {
      console.error(
        'Reject driver error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to reject driver'
      )
    } finally {
      setActionDriverId(null)
    }
  }

  // --------------------------------------------------
  // Approve vehicle change
  // --------------------------------------------------

  const handleApproveVehicle =
    async (requestId) => {
      try {
        setActionRequestId(
          requestId
        )

        await approveVehicleChangeRequestAPI(
          requestId
        )

        toast.success(
          'Vehicle change approved'
        )

        await loadVehicleRequests()
        await loadDrivers(true)
      } catch (error) {
        console.error(
          'Approve vehicle change error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to approve vehicle change'
        )
      } finally {
        setActionRequestId(null)
      }
    }

  // --------------------------------------------------
  // Reject vehicle change
  // --------------------------------------------------

  const handleRejectVehicle =
    async (requestId) => {
      const confirmed =
        window.confirm(
          'Are you sure you want to reject this vehicle change request?'
        )

      if (!confirmed) {
        return
      }

      try {
        setActionRequestId(
          requestId
        )

        await rejectVehicleChangeRequestAPI(
          requestId
        )

        toast.success(
          'Vehicle change request rejected'
        )

        await loadVehicleRequests()
      } catch (error) {
        console.error(
          'Reject vehicle change error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to reject vehicle change'
        )
      } finally {
        setActionRequestId(null)
      }
    }

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = () => {
    logout()

    toast.success('Logged out')

    router.replace('/login')
  }

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const statistics = useMemo(() => {
    const total =
      drivers.length

    const approved =
      drivers.filter(
        (driver) =>
          driver.isApproved
      ).length

    const pending =
      drivers.filter(
        (driver) =>
          !driver.isApproved
      ).length

    const online =
      drivers.filter(
        (driver) =>
          driver.isApproved &&
          driver.isAvailable
      ).length

    return {
      total,
      approved,
      pending,
      online,
    }
  }, [drivers])

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />

          <p className="mt-3 text-sm text-gray-500">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AdminHeader
        user={user}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck size={15} />

              Administration
            </div>

            <h1 className="mt-2 text-2xl font-semibold">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage driver registrations and vehicle change requests.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await loadDrivers(true)
              await loadVehicleRequests()
            }}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh
          </button>
        </div>

        {/* Statistics */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <Users
              size={19}
              className="text-gray-500"
            />

            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
              Total drivers
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {statistics.total}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <CheckCircle2
              size={19}
              className="text-green-500"
            />

            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
              Approved
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {statistics.approved}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <Clock3
              size={19}
              className="text-amber-500"
            />

            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
              Pending drivers
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {statistics.pending}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />

              <span className="text-xs text-gray-500">
                Live
              </span>
            </div>

            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">
              Online drivers
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {statistics.online}
            </p>
          </div>
        </div>

        {/* Vehicle change requests */}

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Vehicle Change Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review changes submitted by approved drivers.
              </p>
            </div>

            <span className="w-fit rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-gray-400">
              {vehicleRequests.length}{' '}
              pending
            </span>
          </div>

          {vehicleRequests.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
              <Clock3
                size={30}
                className="mx-auto mb-3 text-gray-600"
              />

              <h3 className="font-medium text-white">
                No vehicle changes pending
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                New driver vehicle requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleRequests.map(
                (request) => (
                  <VehicleChangeRequestCard
                    key={request.id}
                    request={request}
                    onApprove={
                      handleApproveVehicle
                    }
                    onReject={
                      handleRejectVehicle
                    }
                    actionLoading={
                      actionRequestId ===
                      request.id
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* Driver registrations */}

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Registered Drivers
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Approve or reject driver registrations.
              </p>
            </div>

            <span className="w-fit rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-gray-400">
              {drivers.length}{' '}
              drivers
            </span>
          </div>

          {drivers.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
              <Users
                size={32}
                className="mx-auto mb-3 text-gray-600"
              />

              <h3 className="font-medium text-white">
                No drivers registered
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Registered driver accounts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drivers.map(
                (driver) => (
                  <DriverApprovalCard
                    key={driver.id}
                    driver={driver}
                    onApprove={
                      handleApprove
                    }
                    onReject={
                      handleReject
                    }
                    actionLoading={
                      actionDriverId ===
                      driver.id
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* Footer */}

        <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-600">
          <XCircle size={13} />

          <span>
            Admin actions are protected by server-side role authorization.
          </span>
        </div>
      </main>
    </div>
  )
}