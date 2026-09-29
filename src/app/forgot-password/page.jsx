'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Mail,
  ArrowLeft,
  Send,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { forgotPasswordAPI } from '../../api/auth.api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)

    try {
      await forgotPasswordAPI({
        email: normalizedEmail,
      })

      setSubmitted(true)

      toast.success(
        'If an account exists, reset instructions have been sent.'
      )
    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      )

      toast.error(
        error.response?.data?.message ||
          'Unable to send reset instructions. Please try again.'
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
            Reset your password
          </p>

        </div>

        {/* CARD */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          {!submitted ? (
            <>
              <div className="mb-6">

                <h2 className="text-lg font-semibold text-gray-950">
                  Forgot your password?
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-gray-500">
                  Enter the email address associated
                  with your SmartCity account and
                  we'll send you instructions to reset
                  your password.
                </p>

              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
                    />

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
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Reset Instructions
                    </>
                  )}

                </button>

              </form>
            </>
          ) : (

            /* SUCCESS STATE */

            <div className="py-4 text-center">

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">

                <Mail
                  size={22}
                  className="text-green-600"
                />

              </div>

              <h2 className="text-lg font-semibold text-gray-950">
                Check your email
              </h2>

              <p className="mt-2 text-sm leading-5 text-gray-500">

                If an account exists for

                <span className="font-medium text-gray-700">
                  {' '}
                  {email}
                </span>

                , you will receive password
                reset instructions.

              </p>

              <p className="mt-3 text-xs leading-5 text-gray-400">
                The reset link will expire in 15 minutes.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                className="mt-5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                Try another email
              </button>

            </div>

          )}

        </div>

        {/* BACK TO LOGIN */}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >

          <ArrowLeft size={15} />

          Back to login

        </Link>

      </div>
    </div>
  )
}