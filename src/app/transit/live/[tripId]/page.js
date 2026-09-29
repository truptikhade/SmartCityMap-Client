'use client'

import dynamic from 'next/dynamic'

const LiveLocationMap = dynamic(
  () => import('./LiveLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading live location...
        </p>
      </div>
    ),
  }
)

export default function LiveLocationPage() {
  return <LiveLocationMap />
}