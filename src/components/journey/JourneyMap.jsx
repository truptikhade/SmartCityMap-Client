'use client'

import dynamic from 'next/dynamic'

const JourneyMapClient = dynamic(
  () => import('./JourneyMapClient'),
  {
    ssr: false,

    loading: () => (
      <div
        className="
          h-full
          min-h-[500px]
          w-full
          animate-pulse
          rounded-2xl
          bg-gray-400
        "
      />
    ),
  }
)

export default function JourneyMap(props) {
  return (
    <JourneyMapClient {...props} />
  )
}