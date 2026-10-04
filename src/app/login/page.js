'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'

import {
  MapPin,
  Mail,
  Lock,
  Loader2,
  Car,
  Eye,
  EyeOff,
} from 'lucide-react'

import { loginAPI } from '../../api/auth.api'
import { setCredentials } from '../../store/authSlice'

export default function Login() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email.trim() || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const res = await loginAPI({
        email: form.email.trim(),
        password: form.password,
      })

      const user = res.data.data.user
      const token = res.data.data.token

      dispatch(
        setCredentials({
          user,
          token,
        })
      )

      toast.success('Welcome back!')

      if (user.role === 'driver') {
        router.replace('/driver')
        return
      }

      if (user.role === 'admin') {
        router.replace('/admin')
        return
      }

      router.replace('/')
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          'Login failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div>
        <image src={require('login.jpg')}/>
      </div>
      <div className="w-full max-w-sm">

        {/* LOGO */}

        <div className="mb-8 flex flex-col items-center">

          <div className="mb-3 rounded-2xl bg-blue-600 p-3 shadow-sm">
            <MapPin
              className="text-white"
              size={28}
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            SmartCity
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue
          </p>

        </div>

        {/* LOGIN CARD */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >

          {/* EMAIL */}

          <div>

            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <div className="relative">

              <Mail
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />

            </div>

          </div>

          {/* PASSWORD */}

          <div>

            <div className="mb-1.5 flex items-center justify-between">

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
              >
                Forgot password?
              </Link>

            </div>

            <div className="relative">

              <Lock
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                id="password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-11 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
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

          {/* SIGN IN */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading && (
              <Loader2
                className="animate-spin"
                size={16}
              />
            )}

            {loading
              ? 'Signing in...'
              : 'Sign In'}

          </button>

        </form>

        {/* REGISTER */}

        <p className="mt-6 text-center text-sm text-gray-500">

          Don't have an account?{' '}

          <Link
            href="/register"
            className="font-medium text-blue-600 transition hover:text-blue-700"
          >
            Sign up
          </Link>

        </p>

        {/* DRIVER REGISTRATION */}

        {/* <div className="mt-5 border-t border-gray-200 pt-5 text-center">

          <p className="mb-2 text-xs text-gray-500">
            Want to drive with SmartCity?
          </p>

          <Link
            href="/register?role=driver"
            className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            <Car size={15} />
            Register as Driver
          </Link>

        </div> */}

      </div>

    </div>
  )
}