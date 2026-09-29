'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Send,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import {
  getDriverProfileAPI,
  updateDriverProfileAPI,
  getVehicleChangeRequestsAPI,
  requestVehicleChangeAPI,
} from '../../api/driver.api'

export default function DriverProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
  })

  const [vehicle, setVehicle] = useState(null)
  const [changeRequests, setChangeRequests] = useState([])

  const [showVehicleForm, setShowVehicleForm] = useState(false)

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    color: '',
  })

  useEffect(() => {
    loadProfile()
    loadVehicleChangeRequests()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)

      const response = await getDriverProfileAPI()

      const data =
        response?.data?.data ||
        response?.data ||
        response

      const user = data?.user || {}
      const vehicles = data?.vehicles || []

      setForm({
        fname: user.fname || '',
        lname: user.lname || '',
        email: user.email || '',
        phone: user.phone || '',
      })

      const activeVehicle =
        vehicles.find(
          (item) =>
            item.isActive &&
            item.approvalStatus === 'APPROVED'
        ) ||
        vehicles.find((item) => item.isActive) ||
        vehicles[0] ||
        null

      setVehicle(activeVehicle)
    } catch (error) {
      console.error('Failed to load driver profile:', error)

      toast.error(
        error?.response?.data?.message ||
          'Failed to load profile'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleChangeRequests = async () => {
    try {
      const response = await getVehicleChangeRequestsAPI()

      const data =
        response?.data?.data ||
        response?.data ||
        response

      setChangeRequests(
        Array.isArray(data)
          ? data
          : data?.requests || []
      )
    } catch (error) {
      console.error(
        'Failed to load vehicle change requests:',
        error
      )
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleVehicleChange = (event) => {
    const { name, value } = event.target

    setVehicleForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)

      await updateDriverProfileAPI({
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

      toast.success('Profile updated successfully')

      await loadProfile()
    } catch (error) {
      console.error(
        'Failed to update driver profile:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to update profile'
      )
    } finally {
      setSaving(false)
    }
  }

  const pendingRequest = useMemo(() => {
    return changeRequests.find(
      (request) =>
        String(request.status || '').toUpperCase() ===
        'PENDING'
    )
  }, [changeRequests])

  const handleRequestVehicleChange = async (event) => {
    event.preventDefault()

    if (pendingRequest) {
      toast.error(
        'You already have a pending vehicle change request.'
      )
      return
    }

    if (!vehicleForm.vehicleNumber.trim()) {
      toast.error('Vehicle number is required')
      return
    }

    try {
      setRequesting(true)

      await requestVehicleChangeAPI({
        vehicleNumber:
          vehicleForm.vehicleNumber.trim().toUpperCase(),

        vehicleType:
          vehicleForm.vehicleType,

        brand:
          vehicleForm.brand.trim() || undefined,

        model:
          vehicleForm.model.trim() || undefined,

        color:
          vehicleForm.color.trim() || undefined,
      })

      toast.success(
        'Vehicle change request submitted for admin approval'
      )

      setVehicleForm({
        vehicleNumber: '',
        vehicleType: 'car',
        brand: '',
        model: '',
        color: '',
      })

      setShowVehicleForm(false)

      await loadVehicleChangeRequests()
      await loadProfile()
    } catch (error) {
      console.error(
        'Failed to request vehicle change:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Failed to submit vehicle change request'
      )
    } finally {
      setRequesting(false)
    }
  }

  const getStatusStyles = (status) => {
    const normalized =
      String(status || '').toUpperCase()

    if (normalized === 'APPROVED') {
      return {
        container:
          'bg-emerald-50 border-emerald-200',
        text:
          'text-emerald-700',
        icon:
          <CheckCircle2 className="h-4 w-4" />,
      }
    }

    if (normalized === 'REJECTED') {
      return {
        container:
          'bg-red-50 border-red-200',
        text:
          'text-red-700',
        icon:
          <XCircle className="h-4 w-4" />,
      }
    }

    return {
      container:
        'bg-amber-50 border-amber-200',
      text:
        'text-amber-700',
      icon:
        <Clock3 className="h-4 w-4" />,
    }
  }

  const formatDate = (date) => {
    if (!date) {
      return '—'
    }

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
      return '—'
    }

    return parsed.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/driver')}
            className="mb-4 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>

          <h1 className="text-2xl font-semibold text-slate-900">
            Driver Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account and registered vehicle.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Personal Details */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Personal details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the information associated with your driver account.
              </p>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    First name
                  </label>

                  <input
                    type="text"
                    name="fname"
                    value={form.fname}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Last name
                  </label>

                  <input
                    type="text"
                    name="lname"
                    value={form.lname}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Current Vehicle */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Current vehicle
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your currently registered vehicle.
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <Car className="h-5 w-5 text-slate-700" />
              </div>
            </div>

            {vehicle ? (
              <div className="space-y-4">

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs text-slate-500">
                        Vehicle number
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {vehicle.vehicleNumber || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Vehicle type
                      </p>

                      <p className="mt-1 font-medium capitalize text-slate-900">
                        {vehicle.vehicleType || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Brand
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {vehicle.brand || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Model
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {vehicle.model || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Color
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {vehicle.color || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Approval status
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          vehicle.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : vehicle.approvalStatus === 'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {vehicle.approvalStatus || 'APPROVED'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Request button */}
                {!pendingRequest && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowVehicleForm(
                        (previous) => !previous
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    {showVehicleForm
                      ? 'Cancel vehicle change'
                      : 'Request vehicle change'}
                  </button>
                )}

                {pendingRequest && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          Vehicle change pending
                        </p>

                        <p className="mt-1 text-sm text-amber-700">
                          Your request is waiting for admin approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Car className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No vehicle found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your registered vehicle will appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Vehicle Change Form */}
        {showVehicleForm && !pendingRequest && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Request vehicle change
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Submit your new vehicle details. The vehicle will only
                become active after admin approval.
              </p>
            </div>

            <form
              onSubmit={handleRequestVehicleChange}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Vehicle number
                  </label>

                  <input
                    type="text"
                    name="vehicleNumber"
                    value={vehicleForm.vehicleNumber}
                    onChange={handleVehicleChange}
                    placeholder="e.g. MH12AB1234"
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Vehicle type
                  </label>

                  <select
                    name="vehicleType"
                    value={vehicleForm.vehicleType}
                    onChange={handleVehicleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="car">
                      Car
                    </option>

                    <option value="twoWheeler">
                      Two Wheeler
                    </option>

                    <option value="auto">
                      Auto
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Brand
                  </label>

                  <input
                    type="text"
                    name="brand"
                    value={vehicleForm.brand}
                    onChange={handleVehicleChange}
                    placeholder="e.g. Hyundai"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Model
                  </label>

                  <input
                    type="text"
                    name="model"
                    value={vehicleForm.model}
                    onChange={handleVehicleChange}
                    placeholder="e.g. i20"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Color
                  </label>

                  <input
                    type="text"
                    name="color"
                    value={vehicleForm.color}
                    onChange={handleVehicleChange}
                    placeholder="e.g. White"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowVehicleForm(false)
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={requesting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit request
                    </>
                  )}
                </button>

              </div>
            </form>
          </section>
        )}

        {/* Request History */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Vehicle change history
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track your previous vehicle change requests.
            </p>
          </div>

          {changeRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Clock3 className="mx-auto h-7 w-7 text-slate-400" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No vehicle change requests
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your submitted requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">

              {changeRequests.map((request) => {
                const status =
                  String(
                    request.status || 'PENDING'
                  ).toUpperCase()

                const statusStyle =
                  getStatusStyles(status)

                return (
                  <div
                    key={request.id}
                    className={`rounded-xl border p-4 ${statusStyle.container}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-semibold text-slate-900">
                            {request.vehicleNumber || '—'}
                          </p>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.text}`}
                          >
                            {statusStyle.icon}
                            {status}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          <span className="capitalize">
                            {request.vehicleType || '—'}
                          </span>

                          {request.brand && (
                            <span>
                              {request.brand}
                              {request.model
                                ? ` ${request.model}`
                                : ''}
                            </span>
                          )}

                          {request.color && (
                            <span>
                              {request.color}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs text-slate-500">
                          Requested
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(
                            request.requestedAt
                          )}
                        </p>

                        {request.reviewedAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            Reviewed{' '}
                            {formatDate(
                              request.reviewedAt
                            )}
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}

            </div>
          )}
        </section>

      </div>
    </main>
  )
}