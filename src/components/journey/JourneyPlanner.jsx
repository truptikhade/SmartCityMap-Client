'use client'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

import JourneySearch from './JourneySearch'
import JourneyMap from './JourneyMap'
import TransportOptions from './TransportOptions'

import AIAssistantPanel from '../ai/AIAssistantPanel'
import AIAssistantButton from '../ai/AIAssistantButton'

import {
  setJourney,
  setSelectedTransport,
  setSelectedPlace,
  clearJourney,
} from '../../store/mapSlice'

export default function JourneyPlanner({
  initialJourney = null,
  initialCenter = [18.5204, 73.8567],
  showTitle = true,
}) {
  const router = useRouter()
  const dispatch = useDispatch()

  // ---------------------------------------------
  // GLOBAL JOURNEY STATE
  // ---------------------------------------------

  const journey = useSelector(
    (state) => state.map.journey
  )

  const selectedTransport = useSelector(
    (state) => state.map.selectedTransport
  )

  const selectedPlace = useSelector(
    (state) => state.map.selectedPlace
  )

  const [aiOpen, setAiOpen] = useState(false)

  // ---------------------------------------------
  // INITIAL JOURNEY
  // ---------------------------------------------
  //
  // Used for old pages that pass initialJourney.
  //
  // Important:
  // Do NOT overwrite an existing Redux journey
  // with null.
  //
  useEffect(() => {
    if (initialJourney) {
      dispatch(setJourney(initialJourney))
    }
  }, [initialJourney, dispatch])

  // ---------------------------------------------
  // Journey search
  // ---------------------------------------------

  const handleSearch = (result) => {
    dispatch(setJourney(result))

    // A new search starts a new journey.
    dispatch(setSelectedTransport(null))
    dispatch(setSelectedPlace(null))
  }

  // ---------------------------------------------
  // Clear Route
  // ---------------------------------------------

  const handleClearRoute = () => {
    dispatch(clearJourney())
  }

  // ---------------------------------------------
  // Booking
  // ---------------------------------------------

  const handleBook = (option) => {
    sessionStorage.setItem(
      'bookingData',
      JSON.stringify(option)
    )

    router.push('/bookings/create')
  }

  // ---------------------------------------------
  // AI place selection
  // ---------------------------------------------

  const handleLocatePlace = (place) => {
    dispatch(setSelectedPlace(place))
  }

  // ---------------------------------------------
  // Map center for AI
  // ---------------------------------------------

  const aiLatitude =
    journey?.from?.lat ??
    journey?.from?.latitude ??
    initialCenter[0]

  const aiLongitude =
    journey?.from?.lng ??
    journey?.from?.longitude ??
    initialCenter[1]

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  return (
    <div className="w-full">

      {/* PAGE TITLE */}
      {showTitle && (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Plan your journey
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Search your destination, compare available
            transport and book your journey.
          </p>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div
        className="
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-[450px_minmax(0,1fr)]
        "
      >

        {/* LEFT SIDE */}
        <div className="space-y-4">

          <JourneySearch
            onSearch={handleSearch}
            onClear={handleClearRoute}
            initialFrom={
              journey?.from?.name ||
              journey?.from?.display_name ||
              ''
            }
            initialTo={
              journey?.to?.name ||
              journey?.to?.display_name ||
              ''
            }
          />

          {journey && (
            <TransportOptions
              journey={journey}
              onBook={handleBook}
            />
          )}

        </div>

        {/* RIGHT SIDE — MAP */}
        <div className="relative h-[620px] min-w-0">

          <div
            className="
              absolute
              inset-0
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-gray-100
            "
          >
            <JourneyMap
              journey={journey}
              initialCenter={initialCenter}
              selectedPlace={selectedPlace}
              selectedTransport={selectedTransport}
            />
          </div>

          {/* AI PANEL */}
          {aiOpen && (
            <div
              className="
                absolute
                right-4
                top-4
                z-[1000]
              "
            >
              <AIAssistantPanel
                lat={aiLatitude}
                lng={aiLongitude}
                onLocate={handleLocatePlace}
              />
            </div>
          )}

          {/* AI BUTTON */}
          <div
            className="
              absolute
              bottom-4
              right-4
              z-[1100]
            "
          >
            <AIAssistantButton
              open={aiOpen}
              onClick={() =>
                setAiOpen((value) => !value)
              }
            />
          </div>

        </div>

      </div>
    </div>
  )
}