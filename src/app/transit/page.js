'use client'

import Navbar from '../../components/ui/Navbar'
import JourneyPlanner from '../../components/journey/JourneyPlanner'

export default function TransitPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <JourneyPlanner />
    </div>
  )
}