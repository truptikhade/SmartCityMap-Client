'use client'
import { useEffect, useState }      from 'react'
import { useRouter, useParams }     from 'next/navigation'
import { useAuth }                  from '../../../hooks/useAuth'
import { getPlaceByIdAPI, getReviewsAPI, addReviewAPI } from '../../../api/places.api'
import Navbar                       from '../../../components/ui/Navbar'
import {
  MapPin, Star, Clock, Navigation,
  ThumbsUp, MessageSquare, Send, ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

const categoryColors = {
  hospital:   'bg-red-600',
  restaurant: 'bg-orange-600',
  market:     'bg-yellow-600',
  temple:     'bg-purple-600',
  atm:        'bg-green-600',
  pharmacy:   'bg-blue-600',
  other:      'bg-gray-600',
}

const categoryEmojis = {
  hospital:   '🏥',
  restaurant: '🍽️',
  market:     '🛒',
  temple:     '🛕',
  atm:        '🏧',
  pharmacy:   '💊',
  other:      '📍',
}

export default function PlaceDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { isAuthenticated, loading: authLoading, user } = useAuth()

  const [place,          setPlace]          = useState(null)
  const [reviews,        setReviews]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [reviewForm,     setReviewForm]     = useState({ rating: 5, comment: '' })
  const [submitting,     setSubmitting]     = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [mounted,        setMounted]        = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !id) return

    const fetchData = async () => {
      try {
        const [placeRes, reviewsRes] = await Promise.all([
          getPlaceByIdAPI(id),
          getReviewsAPI(id),
        ])
        setPlace(placeRes.data.data)
        setReviews(reviewsRes.data.data || [])
      } catch {
        toast.error('Failed to load place details')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, id, router])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmitting(true)
    try {
      const res = await addReviewAPI(id, reviewForm)
      setReviews((prev) => [res.data.data, ...prev])
      setReviewForm({ rating: 5, comment: '' })
      setShowReviewForm(false)
      toast.success('Review added!')

      // Update place rating locally
      const newAvg = reviews.length === 0
        ? reviewForm.rating
        : ((place.rating * reviews.length) + reviewForm.rating) / (reviews.length + 1)
      setPlace((prev) => ({ ...prev, rating: Math.round(newAvg * 10) / 10 }))

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add review')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">📍</div>
      </div>
    )
  }

  if (!place) return null

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white
                     text-sm mb-6 transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Place Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">

          {/* Category badge + name */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-white text-xs px-2 py-1 rounded-full capitalize
                                  ${categoryColors[place.category] || 'bg-gray-600'}`}>
                  {categoryEmojis[place.category]} {place.category}
                </span>
              </div>
              <h1 className="text-white text-2xl font-bold">{place.name}</h1>
            </div>
            <div className="text-4xl">
              {categoryEmojis[place.category] || '📍'}
            </div>
          </div>

          {/* Address */}
          {place.address && (
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <MapPin size={14} className="text-blue-400 flex-shrink-0" />
              {place.address}
            </div>
          )}

          {/* Open hours */}
          {place.openHours && (
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
              <Clock size={14} className="text-green-400 flex-shrink-0" />
              {place.openHours}
            </div>
          )}

          {/* Coordinates */}
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
            <Navigation size={12} />
            {place.lat?.toFixed(4)}, {place.lng?.toFixed(4)}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {Number(place.rating || 0).toFixed(1)}
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[1,2,3,4,5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    className={star <= Math.round(place.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'}
                  />
                ))}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length
                const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs w-2">{star}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-gray-600 text-xs w-4">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Nearby Specialties */}
        {place.nearbySpecialties && place.nearbySpecialties.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              🤖 AI Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {place.nearbySpecialties.map((s) => (
                <div
                  key={s.id}
                  className="bg-blue-900/40 border border-blue-800 rounded-xl
                             px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-blue-300 text-xs capitalize">
                    {s.specialtyType}
                  </span>
                  {s.aiScore && (
                    <span className="text-blue-500 text-xs">
                      {Number(s.aiScore).toFixed(1)} ★
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <MessageSquare size={15} className="text-blue-400" />
              Reviews ({reviews.length})
            </h2>

            {mounted && isAuthenticated && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white
                           px-3 py-1.5 rounded-xl transition"
              >
                {showReviewForm ? 'Cancel' : '+ Add Review'}
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700"
            >
              <h3 className="text-white text-sm font-medium mb-3">
                Your Review
              </h3>

              {/* Star rating picker */}
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="transition"
                  >
                    <Star
                      size={24}
                      className={star <= reviewForm.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600 hover:text-yellow-300'}
                    />
                  </button>
                ))}
                <span className="text-gray-400 text-sm ml-2">
                  {reviewForm.rating}/5
                </span>
              </div>

              {/* Comment */}
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 text-white
                           rounded-xl px-4 py-3 text-sm focus:outline-none
                           focus:border-blue-500 placeholder-gray-500 resize-none mb-3"
              />

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                           disabled:opacity-60 text-white text-sm font-medium
                           px-4 py-2 rounded-xl transition"
              >
                <Send size={13} />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <ThumbsUp size={28} className="mx-auto mb-2 text-gray-700" />
              <p className="text-gray-500 text-sm">No reviews yet</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Review Card Component ─────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center
                            justify-center text-white text-xs font-bold">
              {review.user?.fname?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-white text-sm font-medium">
              {review.user?.fname || 'User'} {review.user?.lname || ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((star) => (
            <Star
              key={star}
              size={11}
              className={star <= review.rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-700'}
            />
          ))}
        </div>
      </div>

      {review.comment && (
        <p className="text-gray-400 text-sm leading-relaxed pl-9">
          {review.comment}
        </p>
      )}

      <div className="text-gray-600 text-xs mt-2 pl-9">
        {new Date(review.createdAt).toLocaleDateString('en-IN', {
          day:   'numeric',
          month: 'short',
          year:  'numeric',
        })}
      </div>
    </div>
  )
}