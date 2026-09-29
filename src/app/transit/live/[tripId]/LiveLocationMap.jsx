'use client'

import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Home } from 'lucide-react'

const LiveMap = dynamic(
  () => import('./LiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">
          Loading map...
        </p>
      </div>
    ),
  }
)

export default function LiveLocationMap() {
  const params = useParams()
  const router = useRouter()

  const tripId = params?.tripId

  if (!tripId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-red-500">
          Trip ID is missing.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100">

      <LiveMap tripId={tripId} />

      {/* Back button */}

      <button
        type="button"
        onClick={() => router.back()}
        className="
          absolute
          left-5
          top-5
          z-[2000]
          flex
          items-center
          gap-2
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          py-2.5
          text-sm
          font-medium
          text-gray-800
          shadow-md
          transition
          hover:bg-gray-50
        "
      >
        <Home
          size={17}
        />

      </button>

    </div>
  )
}