'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'

import {
  MapPin,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  Navigation,
   Eye,
  EyeOff,
} from 'lucide-react'

import {
  registerAPI,
  registerDriverAPI,
} from '../../api/auth.api'

import { setCredentials } from '../../store/authSlice'

export default function Register() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  const initialRole =
    searchParams.get('role') === 'driver'
      ? 'driver'
      : 'user'

  const [role, setRole] = useState(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    password: '',

    licenseNumber: '',
    vehicleNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    color: '',
  })

  const [loading, setLoading] = useState(false)

  // --------------------------------------------------
  // Input change
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // --------------------------------------------------
  // Role change
  // --------------------------------------------------

  const handleRoleChange = (nextRole) => {
    setRole(nextRole)
  }

  // --------------------------------------------------
  // Validation
  // --------------------------------------------------

  const validateCommonFields = () => {
    if (
      !form.fname.trim() ||
      !form.lname.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      toast.error('Please fill in all personal details')
      return false
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }

    return true
  }

  const validateDriverFields = () => {
    if (
      !form.licenseNumber.trim() ||
      !form.vehicleNumber.trim() ||
      !form.vehicleType
    ) {
      toast.error('Please fill in all driver and vehicle details')
      return false
    }

    return true
  }

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateCommonFields()) {
      return
    }

    if (
      role === 'driver' &&
      !validateDriverFields()
    ) {
      return
    }

    setLoading(true)

    try {
      // ----------------------------------------------
      // Passenger registration
      // ----------------------------------------------

      if (role === 'user') {
        const res = await registerAPI({
          fname: form.fname.trim(),
          lname: form.lname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        })

        const data = res.data.data

        dispatch(
          setCredentials({
            user: data.user,
            token: data.token,
          })
        )

        toast.success('Account created!')

        router.push('/')

        return
      }

      // ----------------------------------------------
      // Driver registration
      // ----------------------------------------------

      const res = await registerDriverAPI({
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,

        licenseNumber: form.licenseNumber.trim(),

        vehicleNumber: form.vehicleNumber.trim(),

        vehicleType: form.vehicleType,

        brand: form.brand.trim() || undefined,

        model: form.model.trim() || undefined,

        color: form.color.trim() || undefined,
      })

      const data = res.data.data

      dispatch(
        setCredentials({
          user: data.user,
          token: data.token,
        })
      )

      toast.success(
        'Driver account created successfully!'
      )

      router.push('/driver')
    } catch (error) {
      console.error(
        'Registration error:',
        error
      )

      toast.error(
        error?.response?.data?.message ||
          'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[430px]">

        {/* ------------------------------------------
            Logo / Header
        ------------------------------------------ */}

        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm mb-3">
            <MapPin
              className="text-white"
              size={28}
              strokeWidth={2.4}
            />
          </div>

          <h1 className="text-[27px] leading-none font-bold tracking-tight text-gray-900">
            SmartCity
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            {role === 'driver'
              ? 'Register as a SmartCity driver'
              : 'Create your account'}
          </p>
        </div>

        {/* ------------------------------------------
            Registration Card
        ------------------------------------------ */}

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
        >

          {/* ----------------------------------------
              Role selector
          ---------------------------------------- */}

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">

              <button
                type="button"
                onClick={() =>
                  handleRoleChange('user')
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  role === 'user'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Passenger
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRoleChange('driver')
                }
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  role === 'driver'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Driver
              </button>

            </div>
          </div>

          {/* ----------------------------------------
              Personal Details
          ---------------------------------------- */}

          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              Personal Details
            </h2>

            {/* First + Last name */}

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="fname"
                    value={form.fname}
                    onChange={handleChange}
                    placeholder="Rahul"
                    autoComplete="given-name"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lname"
                  value={form.lname}
                  onChange={handleChange}
                  placeholder="Patil"
                  autoComplete="family-name"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

            </div>

            {/* Email */}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Phone */}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  autoComplete="tel"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password */}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
              </div>
            </div>
          </div>

          {/* ----------------------------------------
              Driver Details
          ---------------------------------------- */}

          {role === 'driver' && (
            <div className="mt-6 pt-6 border-t border-gray-100">

              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                Driver Details
              </h2>

              {/* License */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  License Number
                </label>

                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  placeholder="MH1220261234567"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* Vehicle Details */}

              <h2 className="text-sm font-semibold text-gray-800 mt-6 mb-4">
                Vehicle Details
              </h2>

              {/* Vehicle number + type */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vehicle Number
                  </label>

                  <input
                    type="text"
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="MH12AB1234"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vehicle Type
                  </label>

                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
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

              </div>

              {/* Brand + Model */}

              <div className="grid grid-cols-2 gap-3 mt-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Brand
                  </label>

                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Maruti"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Model
                  </label>

                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="Swift"
                    className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

              </div>

              {/* Color */}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Color
                </label>

                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="White"
                  className="w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* Approval notice */}

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                <div className="flex items-start gap-2.5">

                  <Navigation
                    size={16}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <p className="text-xs leading-5 text-blue-700">
                    Driver accounts require admin approval
                    before you can receive ride requests.
                  </p>

                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------
              Submit
          ---------------------------------------- */}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm"
          >
            {loading && (
              <Loader2
                className="animate-spin"
                size={17}
              />
            )}

            {loading
              ? role === 'driver'
                ? 'Registering driver...'
                : 'Creating account...'
              : role === 'driver'
                ? 'Register as Driver'
                : 'Sign Up'}
          </button>

        </form>

        {/* ------------------------------------------
            Footer
        ------------------------------------------ */}

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}

          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700 transition"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}