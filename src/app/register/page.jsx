'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

import { registerAPI, registerDriverAPI } from '../../api/auth.api'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialRole =
    searchParams.get('role') === 'driver' ? 'driver' : 'user'

  const [role, setRole] = useState(initialRole)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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

  // --------------------------------------------------
  // Handlers
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

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

    if (!validateCommonFields()) return

    if (role === 'driver' && !validateDriverFields()) return

    setLoading(true)

    try {
      if (role === 'user') {
        await registerAPI({
          fname: form.fname.trim(),
          lname: form.lname.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        })
        toast.success('Account created successfully! Please login.')
         router.replace('/login')
        return
      }

      await registerDriverAPI({
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

      toast.success('Driver account created successfully! Please login.')
       router.replace('/login')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(
        error?.response?.data?.message || 'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <div className="w-full max-w-[430px]">
        {/* Header / Logo */}
        <div className="mb-7 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <MapPin className="text-white" size={28} strokeWidth={2.4} />
          </div>

          <h1 className="text-[27px] font-bold leading-none tracking-tight text-gray-900">
            SmartCity
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {role === 'driver'
              ? 'Register as a SmartCity driver'
              : 'Create your account'}
          </p>
        </div>

        {/* Registration Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
        >
          {/* Role Toggle */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleRoleChange('user')}
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
                onClick={() => handleRoleChange('driver')}
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

          {/* Personal Details */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-gray-800">
              Personal Details
            </h2>

            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lname"
                  value={form.lname}
                  onChange={handleChange}
                  placeholder="Patil"
                  autoComplete="family-name"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
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
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
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

          {/* Driver Specific Fields */}
          {role === 'driver' && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-800">
                Driver Details
              </h2>

              {/* License Number */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  placeholder="MH1220261234567"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* Vehicle Section */}
              <h2 className="mb-4 mt-6 text-sm font-semibold text-gray-800">
                Vehicle Details
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="MH12AB1234"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="car">Car</option>
                    <option value="twoWheeler">Two Wheeler</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>

              {/* Brand + Model */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Maruti"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="Swift"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="White"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              {/* Notice */}
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <Navigation
                    size={16}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <p className="text-xs leading-5 text-blue-700">
                    Driver accounts require admin approval before you can
                    receive ride requests.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={17} />}
            {loading
              ? role === 'driver'
                ? 'Registering driver...'
                : 'Creating account...'
              : role === 'driver'
                ? 'Register as Driver'
                : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 transition hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function Register() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}