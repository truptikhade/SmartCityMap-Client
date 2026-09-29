'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import {
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  MapPin,
} from 'lucide-react'

import { verifyEmailAPI } from '../../api/auth.api'

function VerifyEmailForm() {
  const searchParams = useSearchParams()

  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState(
    'Verifying your email address...'
  )

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage(
        'This verification link is invalid or incomplete.'
      )
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await verifyEmailAPI(token)

        setStatus('success')
        setMessage(
          response?.data?.message ||
            'Your email has been verified successfully.'
        )
      } catch (error) {
        console.error(
          'Email verification error:',
          error
        )

        setStatus('error')
        setMessage(
          error?.response?.data?.message ||
            'This verification link is invalid or has expired.'
        )
      }
    }

    verifyEmail()
  }, [searchParams])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* LOGO */}

          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <MapPin size={22} />
              </div>

              <span className="text-xl font-bold text-gray-950">
                SmartCity
              </span>

            </div>
          </div>

          {/* CARD */}

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            {/* VERIFYING */}

            {status === 'verifying' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <Loader2
                    size={30}
                    className="animate-spin text-blue-600"
                  />
                </div>

                <h1 className="text-xl font-bold text-gray-950">
                  Verifying your email
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Please wait while we verify your
                  email address.
                </p>
              </>
            )}

            {/* SUCCESS */}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2
                    size={32}
                    className="text-green-600"
                  />
                </div>

                <h1 className="text-xl font-bold text-gray-950">
                  Email verified
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {message}
                </p>

                <div className="mt-6">
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Continue to Login
                  </Link>
                </div>
              </>
            )}

            {/* ERROR */}

            {status === 'error' && (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <XCircle
                    size={32}
                    className="text-red-600"
                  />
                </div>

                <h1 className="text-xl font-bold text-gray-950">
                  Verification failed
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {message}
                </p>

                <div className="mt-6 space-y-3">

                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Go to Login
                  </Link>

                  <Link
                    href="/"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Back to SmartCity
                  </Link>

                </div>
              </>
            )}

            {/* EMAIL ICON */}

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Mail size={13} />
              <span>
                SmartCity Account Verification
              </span>
            </div>

          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Secure account verification powered by SmartCity
          </p>

        </div>
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  )
}