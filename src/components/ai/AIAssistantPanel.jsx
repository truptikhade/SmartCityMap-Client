'use client'

import { useState } from 'react'
import {
  Bot,
  X,
  RotateCcw,
  Send,
  MapPin,
} from 'lucide-react'

import { getNearbyRecommendationsAPI } from '../../api/places.api'

export default function AIAssistantPanel({
  lat,
  lng,
  onLocate,
  onClose,
}) {
  const [input, setInput] = useState('')
  const [message, setMessage] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const quickQuestions = [
    'Best places to visit',
    'Good restaurants nearby',
    'Places for shopping',
    'Things to do today',
  ]

  const resetAssistant = () => {
    setInput('')
    setMessage('')
    setRecommendations([])
  }

  const askAssistant = async (question) => {
    const text = String(question || '').trim()

    if (!text) return

    if (
      lat == null ||
      lng == null ||
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lng))
    ) {
      setMessage(
        'Location is not available right now.'
      )
      return
    }

    setInput('')
    setLoading(true)
    setMessage('')
    setRecommendations([])

    try {
      const response =
        await getNearbyRecommendationsAPI({
          lat: Number(lat),
          lng: Number(lng),

          // IMPORTANT:
          // Backend expects "message", not "query".
          message: text,
        })

      const data =
        response?.data?.data ||
        response?.data ||
        {}

      const nextRecommendations =
        Array.isArray(data?.recommendations)
          ? data.recommendations
          : []

      setMessage(
        data?.aiMessage ||
          data?.message ||
          `Here are some suggestions for "${text}".`
      )

      setRecommendations(
        nextRecommendations
      )
    } catch (error) {
      console.error(
        'AI recommendation request failed:',
        error
      )

      console.error(
        'AI backend response:',
        error?.response?.data
      )

      setMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'I could not get recommendations right now. Please try again.'
      )

      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (loading) return

    askAssistant(input)
  }

  const handleShowOnMap = (place) => {
    if (!place || !onLocate) return

    const placeLat =
      place.lat ??
      place.latitude ??
      place.location?.lat

    const placeLng =
      place.lng ??
      place.longitude ??
      place.location?.lng

    if (
      placeLat == null ||
      placeLng == null
    ) {
      return
    }

    onLocate({
      ...place,
      lat: Number(placeLat),
      lng: Number(placeLng),
    })
  }

  return (
    <div
      className="
        pointer-events-auto
        flex
        h-[380px]
        w-[320px]
        max-w-[calc(100vw-32px)]
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-amber-400
        shadow-xl
      "
    >
      {/* =========================================
          HEADER
      ========================================== */}

      <div
        className="
          flex
          h-[60px]
          shrink-0
          items-center
          justify-between
          border-b
          border-gray-200
          px-4
        "
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-gray-100
              text-gray-700
            "
          >
            <Bot size={19} />
          </div>

          <div className="min-w-0">
            <h3
              className="
                truncate
                text-sm
                font-semibold
                text-gray-900
              "
            >
              SmartCity Assistant
            </h3>

            <p className="text-xs text-gray-500">
              Travel recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* RESET */}

          <button
            type="button"
            onClick={resetAssistant}
            aria-label="Reset assistant"
            title="Reset"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-800
            "
          >
            <RotateCcw size={16} />
          </button>

          {/* CLOSE */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            title="Close"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-800
            "
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* =========================================
          CONTENT
      ========================================== */}

      <div
        className="
          min-h-0
          flex-1
          overflow-y-auto
          px-4
          py-4
        "
      >
        {/* INTRO / RESPONSE */}

        {message ? (
          <div className="mb-3">
            <p
              className="
                text-sm
                leading-6
                text-gray-600
              "
            >
              {message}
            </p>
          </div>
        ) : (
          <div className="mb-3">
            <h4
              className="
                text-sm
                font-semibold
                text-gray-900
              "
            >
              How can I help?
            </h4>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-gray-500
              "
            >
              Ask me about places, food,
              attractions or things to do
              near your journey.
            </p>
          </div>
        )}

        {/* =====================================
            QUICK QUESTIONS
        ====================================== */}

        {!loading && (
          <div className="space-y-2">
            {quickQuestions.map(
              (question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() =>
                    askAssistant(question)
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-3
                    py-2.5
                    text-left
                    text-xs
                    font-medium
                    text-gray-700
                    transition
                    hover:border-gray-300
                    hover:bg-gray-100
                  "
                >
                  {question}
                </button>
              )
            )}
          </div>
        )}

        {/* =====================================
            LOADING
        ====================================== */}

        {loading && (
          <div
            className="
              flex
              items-center
              gap-2
              py-5
              text-sm
              text-gray-500
            "
          >
            <span
              className="
                h-4
                w-4
                animate-spin
                rounded-full
                border-2
                border-gray-300
                border-t-gray-700
              "
            />

            Finding recommendations...
          </div>
        )}

        {/* =====================================
            RECOMMENDATIONS
        ====================================== */}

        {!loading &&
          recommendations.length > 0 && (
            <div className="mt-3 space-y-2">
              {recommendations.map(
                (place, index) => {
                  const placeName =
                    place?.name ||
                    place?.placeName ||
                    'Recommended place'

                  const placeReason =
                    place?.reason ||
                    place?.description ||
                    ''

                  const placeKey =
                    place?.id ||
                    place?.placeId ||
                    `${placeName}-${index}`

                  return (
                    <div
                      key={placeKey}
                      className="
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        p-3
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          gap-2
                        "
                      >
                        <div
                          className="
                            mt-0.5
                            shrink-0
                            text-gray-500
                          "
                        >
                          <MapPin size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="
                              text-sm
                              font-medium
                              text-gray-900
                            "
                          >
                            {placeName}
                          </p>

                          {placeReason && (
                            <p
                              className="
                                mt-1
                                text-xs
                                leading-5
                                text-gray-500
                              "
                            >
                              {placeReason}
                            </p>
                          )}

                          {/* SHOW ON MAP */}

                          <button
                            type="button"
                            onClick={() =>
                              handleShowOnMap(
                                place
                              )
                            }
                            className="
                              mt-2
                              inline-flex
                              items-center
                              gap-1
                              text-xs
                              font-medium
                              text-gray-400
                              rounded
                              bg-amber-300
                              transition
                              hover:text-black

                              p-0.5
                            "
                          >
                            Map
                           {/* <MapPin size={15}/> */}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          )}

        {/* =====================================
            EMPTY RESULT
        ====================================== */}

        {!loading &&
          message &&
          recommendations.length === 0 && (
            <div
              className="
                mt-3
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-3
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-gray-500
                "
              >
                No specific places were
                returned. Try another question.
              </p>
            </div>
          )}
      </div>

      {/* =========================================
          INPUT
      ========================================== */}

      <form
        onSubmit={handleSubmit}
        className="
          flex
          shrink-0
          items-center
          gap-2
          border-t
          border-gray-200
          bg-white
          p-3
        "
      >
        <input
          type="text"
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder="Ask about places..."
          disabled={loading}
          className="
            min-w-0
            flex-1
            rounded-xl
            border
            border-gray-200
            bg-gray-50
            px-3
            py-2.5
            text-xs
            text-gray-900
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-gray-400
            focus:bg-white
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        />

        <button
          type="submit"
          disabled={
            loading ||
            !input.trim()
          }
          aria-label="Ask assistant"
          title="Ask"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-gray-900
            text-white
            transition
            hover:bg-gray-800
            disabled:cursor-not-allowed
            disabled:bg-gray-300
          "
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}