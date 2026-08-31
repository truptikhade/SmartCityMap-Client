'use client'
import { useEffect, useState } from 'react'
import { useRouter }           from 'next/navigation'
import toast                    from 'react-hot-toast'
import { Ticket, Calendar, Armchair, IndianRupee, MapPin, X } from 'lucide-react'
import { useAuth }             from '../../hooks/useAuth'
import { getMyBookingsAPI, cancelBookingAPI } from '../../api/booking.api'
import Navbar                  from '../../components/ui/Navbar'

const statusColors = {
  confirmed: 'bg-green-600',
  pending:   'bg-yellow-600',
  cancelled: 'bg-red-600',
  completed: 'bg-gray-600',
}

export default function MyBookings() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchBookings = async () => {
      try {
        const res = await getMyBookingsAPI()
        setBookings(res.data.data)
      } catch (err) {
        toast.error('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [isAuthenticated])

  const handleCancel = async (id) => {
    try {
      await cancelBookingAPI(id)
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      )
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">🗺️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-white text-2xl font-bold mb-6 flex items-center gap-2">
          <Ticket size={22} className="text-blue-400" />
          My Bookings
        </h1>

        {bookings.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <Ticket size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-500 text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium text-sm">
                      {booking.route?.name || `${booking.transitType || 'Transit'} booking`}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <MapPin size={11} />
                      {booking.boardingStop?.name || 'Boarding'} → {booking.dropStop?.name || 'Drop'}
                    </p>
                  </div>
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full capitalize
                                    ${statusColors[booking.status] || 'bg-gray-500'}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {booking.travelDate
                        ? new Date(booking.travelDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Armchair size={11} />
                      Seat {booking.seatNumber || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee size={11} />
                      {booking.farePaid ?? 'N/A'}
                    </span>
                  </span>

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 transition"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}