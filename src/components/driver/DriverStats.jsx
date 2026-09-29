'use client'

import {
  CheckCircle2,
  IndianRupee,
  Route,
  XCircle,
} from 'lucide-react'

export default function DriverStats({
  stats = {},
}) {
  const totalTrips =
    stats.totalTrips ??
    stats.total ??
    0

  const completedTrips =
    stats.completedTrips ??
    stats.completed ??
    0

  const cancelledTrips =
    stats.cancelledTrips ??
    stats.cancelled ??
    0

  const totalEarnings =
    stats.totalEarnings ??
    stats.earnings ??
    0

  const cards = [
    {
      label: 'Total Trips',
      value: totalTrips,
      icon: Route,
    },
    {
      label: 'Completed',
      value: completedTrips,
      icon: CheckCircle2,
    },
    {
      label: 'Cancelled',
      value: cancelledTrips,
      icon: XCircle,
    },
    {
      label: 'Total Earnings',
      value: `₹${Number(
        totalEarnings
      ).toFixed(0)}`,
      icon: IndianRupee,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold text-gray-900">
              {card.value}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {card.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}