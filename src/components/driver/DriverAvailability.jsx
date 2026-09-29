'use client'

import {
  CheckCircle2,
  Clock3,
  Power,
  ShieldCheck,
} from 'lucide-react'

export default function DriverAvailability({
  isApproved = false,
  isAvailable = false,
  loading = false,
  onChange,
}) {
  if (!isApproved) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <Clock3
              size={19}
              className="text-amber-700"
            />
          </div>

          <div>
            <h2 className="font-semibold text-amber-900">
              Driver approval pending
            </h2>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Your driver account is waiting for
              administrator approval. You will be able
              to receive ride requests after approval.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isAvailable
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isAvailable
                ? 'bg-emerald-100'
                : 'bg-slate-100'
            }`}
          >
            {isAvailable ? (
              <CheckCircle2
                size={19}
                className="text-emerald-700"
              />
            ) : (
              <Power
                size={19}
                className="text-slate-600"
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900">
                {isAvailable
                  ? 'You are online'
                  : 'You are offline'}
              </h2>

              <span
                className={`h-2 w-2 rounded-full ${
                  isAvailable
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {isAvailable
                ? 'You can receive new ride requests.'
                : 'Go online when you are ready to accept rides.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            onChange(!isAvailable)
          }
          className={`inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isAvailable
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          <Power size={16} />

          {loading
            ? 'Updating...'
            : isAvailable
              ? 'Go offline'
              : 'Go online'}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-200/70 pt-4 text-xs text-slate-500">
        <ShieldCheck size={14} />

        <span>
          Your account is approved and your vehicle is
          eligible to receive ride requests.
        </span>
      </div>
    </div>
  )
}