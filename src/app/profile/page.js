'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'

import { useAuth } from '../../hooks/useAuth'
import { setCredentials } from '../../store/authSlice'

import {
  getProfileAPI,
  updateProfileAPI,
} from '../../api/auth.api'

import Navbar from '../../components/ui/Navbar'
import api from '../../lib/axios'

import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Ticket,
} from 'lucide-react'

import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const {
    user,
    isAuthenticated,
    loading: authLoading,
  } = useAuth()

  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)

  const [bookingCount, setBookingCount] = useState(0)

  const [editing, setEditing] = useState(false)

  const [saving, setSaving] = useState(false)

  const [mounted, setMounted] = useState(false)

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    homeAddress: '',
  })

  /* ============================================================
     MOUNTED
     ============================================================ */

  useEffect(() => {
    setMounted(true)
  }, [])

  /* ============================================================
     AUTHENTICATION + ROLE REDIRECT
     ============================================================ */

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (user?.role === 'driver') {
      router.replace('/driver')
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    router,
  ])

  /* ============================================================
     LOAD PROFILE
     ============================================================ */

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      user?.role === 'driver'
    ) {
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)

        const res = await getProfileAPI()

        const data = res?.data?.data

        setProfile(data)

        setFormData({
          fname: data?.fname || '',
          lname: data?.lname || '',
          homeAddress: data?.homeAddress || '',
        })
      } catch (error) {
        console.error(
          'Profile loading error:',
          error
        )

        toast.error(
          error?.response?.data?.message ||
            'Failed to load profile'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [
    authLoading,
    isAuthenticated,
    user,
  ])

  /* ============================================================
     LOAD BOOKING COUNT
     ============================================================ */

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      user?.role === 'driver'
    ) {
      return
    }

    const fetchBookingCount = async () => {
      try {
        const res = await api.get('/api/booking/my')

        const bookings =
          res?.data?.data ||
          res?.data?.bookings ||
          res?.data ||
          []

        if (Array.isArray(bookings)) {
          setBookingCount(bookings.length)
          return
        }

        if (Array.isArray(bookings?.items)) {
          setBookingCount(bookings.items.length)
          return
        }

        setBookingCount(0)
      } catch (error) {
        console.error(
          'Booking count loading error:',
          error
        )

        setBookingCount(0)
      }
    }

    fetchBookingCount()
  }, [
    authLoading,
    isAuthenticated,
    user,
  ])

  /* ============================================================
     SAVE PROFILE
     ============================================================ */

  const handleSave = async () => {
    setSaving(true)

    try {
      const res = await updateProfileAPI(
        formData
      )

      const updatedProfile =
        res?.data?.data

      setProfile(updatedProfile)

      dispatch(
        setCredentials({
          user: updatedProfile,
          token:
            localStorage.getItem('token'),
        })
      )

      setEditing(false)

      toast.success('Profile updated!')
    } catch (error) {
      console.error(
        'Profile update error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Update failed'
      )
    } finally {
      setSaving(false)
    }
  }

  /* ============================================================
     CANCEL EDITING
     ============================================================ */

  const handleCancel = () => {
    setFormData({
      fname: profile?.fname || '',
      lname: profile?.lname || '',
      homeAddress:
        profile?.homeAddress || '',
    })

    setEditing(false)
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

            Loading profile...
          </div>
        </div>
      </div>
    )
  }

  /* ============================================================
     DRIVER
     ============================================================ */

  if (user?.role === 'driver') {
    return null
  }

  /* ============================================================
     NO PROFILE
     ============================================================ */

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-500 shadow-sm">
            Profile information is unavailable.
          </div>
        </div>
      </div>
    )
  }

  const initials =
    `${profile.fname?.[0] || ''}${
      profile.lname?.[0] || ''
    }`.toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ======================================================
          NAVBAR
          ====================================================== */}

      <Navbar />

      {/* ======================================================
          PROFILE CONTENT
          ====================================================== */}

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-4">

          {/* ==================================================
              PROFILE HEADER
              ================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">

              {/* USER */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-sm">
                    {initials || (
                      <User size={28} />
                    )}
                  </div>

                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-green-500" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-gray-950">
                    {mounted
                      ? `${profile.fname} ${
                          profile.lname || ''
                        }`.trim()
                      : ''}
                  </h1>

                  <span
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                      profile.role === 'admin'
                        ? 'border-purple-200 bg-purple-50 text-purple-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>
              </div>

              {/* EDIT / SAVE */}
              {!editing ? (
                <button
                  type="button"
                  onClick={() =>
                    setEditing(true)
                  }
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                  >
                    <X size={14} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} />

                    {saving
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* ==================================================
                PROFILE FIELDS
                ================================================== */}

            <div className="space-y-5">

              {/* FIRST + LAST NAME */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* FIRST NAME */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    First Name
                  </label>

                  {editing ? (
                    <input
                      type="text"
                      value={formData.fname}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          fname:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <User
                        size={14}
                        className="text-gray-400"
                      />

                      {mounted
                        ? profile.fname
                        : ''}
                    </div>
                  )}
                </div>

                {/* LAST NAME */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Last Name
                  </label>

                  {editing ? (
                    <input
                      type="text"
                      value={formData.lname}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          lname:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <User
                        size={14}
                        className="text-gray-400"
                      />

                      {mounted
                        ? profile.lname ||
                          '—'
                        : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Email
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                  <Mail
                    size={14}
                    className="text-gray-400"
                  />

                  {mounted
                    ? profile.email
                    : ''}
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Phone
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                  <Phone
                    size={14}
                    className="text-gray-400"
                  />

                  {mounted
                    ? profile.phone
                    : ''}
                </div>
              </div>

              {/* HOME ADDRESS */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">
                  Home Address
                </label>

                {editing ? (
                  <input
                    type="text"
                    value={
                      formData.homeAddress
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        homeAddress:
                          event.target.value,
                      })
                    }
                    placeholder="Enter your home address"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <MapPin
                      size={14}
                      className="text-gray-400"
                    />

                    {mounted
                      ? profile.homeAddress ||
                        'Not set'
                      : ''}
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* ==================================================
              ACCOUNT INFO
              ================================================== */}

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-950">
              <Shield
                size={16}
                className="text-blue-600"
              />

              Account Info
            </h2>

            <div className="space-y-4">

              {/* VERIFICATION */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Verification
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    profile.isVerified
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {profile.isVerified
                    ? 'Verified'
                    : 'Not Verified'}
                </span>
              </div>

              {/* ACCOUNT STATUS */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Account Status
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    profile.isActive === false
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-green-200 bg-green-50 text-green-700'
                  }`}
                >
                  {profile.isActive === false
                    ? 'Inactive'
                    : 'Active'}
                </span>
              </div>

              {/* MEMBER SINCE */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Member Since
                </span>

                <span className="text-sm font-medium text-gray-900">
                  {mounted &&
                  profile.createdAt
                    ? new Date(
                        profile.createdAt
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )
                    : '—'}
                </span>
              </div>

              {/* LAST LOGIN */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Last Login
                </span>

                <span className="text-sm font-medium text-gray-900">
                  {mounted &&
                  profile.lastLogin
                    ? new Date(
                        profile.lastLogin
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )
                    : '—'}
                </span>
              </div>
            </div>
          </section>
          
        </div>
      </main>
    </div>
  )
}