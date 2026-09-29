'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export default function TransitMapViewController({
  coordinates,
}) {
  const map = useMap()

  useEffect(() => {
    if (
      !map ||
      !Array.isArray(coordinates) ||
      coordinates.length === 0
    ) {
      return
    }

    const bounds =
      coordinates.map(
        (point) => [
          Number(point.lat),
          Number(point.lng),
        ]
      )

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
    })
  }, [map, coordinates])

  return null
}