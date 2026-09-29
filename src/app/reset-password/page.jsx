'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  MapPin,
  Lock,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'

import toast from 'react-hot-toast'

import { resetPasswordAPI } from '../../api/auth.api'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const resetToken = searchParams.get('token')

    if (resetToken) {
      setToken(resetToken)
    }
  }, [searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      toast.error(
        'Invalid or missing password reset link.'
      )
      return
    }

    if (!password || !confirmPassword) {
      toast.error(
        'Please enter and confirm your new password.'
      )
      return
    }

    if (password.length < 6) {
      toast.error(
        'Password must be at least 6 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      toast.error(
        'Passwords do not match.'
      )
      return
    }

    setLoading(true)

    try {
      await resetPasswordAPI({
        token,
        newPassword: password,
      })

      setSuccess(true)

      toast.success(
        'Password reset successfully.'
      )
    } catch (error) {
      console.error(
        'Reset password error:',
        error
      )

      toast.error(
        error.response?.data?.message ||
          'Invalid or expired reset link.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* LOGO */}

        <div className="mb-8 flex flex-col items-center">

          <div className="mb-3 rounded-2xl bg-blue-600 p-3 shadow-sm">
            <MapPin
              size={28}
              className="text-white"
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            SmartCity
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new password
          </p>

        </div>

        {/* CARD */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          {!success ? (

            <>
              <div className="mb-6">

                <h2 className="text-lg font-semibold text-gray-950">
                  Reset your password
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-gray-500">
                  Enter a new password for your
                  SmartCity account.
                </p>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NEW PASSWORD */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    New password
                  </label>

                  <div className="relative">

                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                {/* CONFIRM PASSWORD */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm password
                  </label>

                  <div className="relative">

                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Enter password again"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                  </div>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Resetting...
                    </>
                  ) : (
                    <>
                      <Save size={16} />

                      Reset Password
                    </>
                  )}

                </button>

              </form>
            </>

          ) : (

            <div className="py-4 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle
                  size={24}
                  className="text-green-600"
                />
              </div>

              <h2 className="text-lg font-semibold text-gray-950">
                Password reset successful
              </h2>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                Your password has been updated.
                You can now sign in using your
                new password.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.replace('/login')
                }
                className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Go to Login
              </button>

            </div>

          )}

        </div>

        {!success && (
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={15} />
            Back to login
          </Link>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}