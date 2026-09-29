'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '../../components/ui/Navbar'
import JourneyPlanner from '../../components/journey/JourneyPlanner'

function DashboardContent() {
  const searchParams = useSearchParams()

  const [journey, setJourney] =
    useState(null)

  useEffect(() => {
    if (
      searchParams.get('showRoute') !== '1'
    ) {
      return
    }

    const stored =
      sessionStorage.getItem(
        'routePreview'
      )

    if (!stored) return

    try {
      setJourney(
        JSON.parse(stored)
      )
    } catch (error) {
      console.error(
        'Could not load route preview',
        error
      )
    }

    sessionStorage.removeItem(
      'routePreview'
    )
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <JourneyPlanner
        initialJourney={journey}
      />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          Loading...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}