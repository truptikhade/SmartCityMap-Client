'use client'

import dynamic from 'next/dynamic'

const TransitRouteMapClient = dynamic(
  () => import('./TransitRouteMapClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl bg-gray-100">
        Loading route map...
      </div>
    ),
  }
)

export default function TransitRouteMap(
  props
) {
  return (
    <TransitRouteMapClient {...props} />
  )
}