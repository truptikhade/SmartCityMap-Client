'use client'

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  X,
} from 'lucide-react'

export default function DriverOtpModal({
  isOpen,
  otp,
  onOtpChange,
  onVerify,
  onClose,
  isLoading = false,
}) {
  const [localOtp, setLocalOtp] =
    useState(otp || '')

  useEffect(() => {
    setLocalOtp(otp || '')
  }, [otp, isOpen])

  if (!isOpen) {
    return null
  }

  const handleChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(/\D/g, '')
        .slice(0, 6)

    setLocalOtp(value)

    if (onOtpChange) {
      onOtpChange(value)
    }
  }

  const handleVerify = () => {
    if (!/^\d{4,6}$/.test(localOtp)) {
      return
    }

    onVerify(localOtp)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <ShieldCheck className="h-5 w-5 text-gray-700" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Verify Passenger
              </h2>

              <p className="text-xs text-gray-500">
                Enter the OTP provided by the passenger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}

        <div className="p-6">
          <p className="text-center text-sm text-gray-500">
            Ask the passenger for the 4–6 digit
            ride OTP shown in their application.
          </p>

          <input
            autoFocus
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={localOtp}
            onChange={handleChange}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter'
              ) {
                handleVerify()
              }
            }}
            placeholder="Enter OTP"
            className="mt-6 w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl font-semibold tracking-[0.4em] text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
          />

          <button
            type="button"
            onClick={handleVerify}
            disabled={
              isLoading ||
              !/^\d{4,6}$/.test(
                localOtp
              )
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />

            {isLoading
              ? 'Verifying...'
              : 'Verify OTP'}
          </button>
        </div>
      </div>
    </div>
  )
}