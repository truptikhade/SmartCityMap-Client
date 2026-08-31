'use client'
import { useEffect, useState }  from 'react'
import { useRouter }            from 'next/navigation'
import Script from 'next/script'
import { useAuth }              from '../../../hooks/useAuth'
import { createBookingAPI }     from '../../../api/booking.api'
import { initiatePaymentAPI }   from '../../../api/payment.api'
import Navbar                   from '../../../components/ui/Navbar'
import { MapPin, Clock, Armchair, IndianRupee, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookingCreatePage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()

  const [bookingData,   setBookingData]   = useState(null)
  const [boardingStop,  setBoardingStop]  = useState('')
  const [dropStop,      setDropStop]      = useState('')
  const [seatNumber,    setSeatNumber]    = useState('')
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login')
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const stored = sessionStorage.getItem('bookingData')
    if (!stored) { router.push('/transit'); return }
    setBookingData(JSON.parse(stored))
  }, [router])

  const handleConfirmBooking = async () => {
    if (!boardingStop) { toast.error('Please select boarding stop'); return }
    if (!dropStop)     { toast.error('Please select drop stop');     return }
    if (boardingStop === dropStop) {
      toast.error('Boarding and drop stop cannot be same')
      return
    }

    setLoading(true)
    try {
      // 1. Create booking
      const bookingRes = await createBookingAPI({
        routeId:        bookingData.routeId,
        tripId:         bookingData.tripId,
        boardingStopId: boardingStop,
        dropStopId:     dropStop,
        transitType:    bookingData.transitType,
        seatNumber:     seatNumber || null,
        farePaid:       bookingData.baseFare,
        travelDate:     bookingData.travelDate,
      })

      const booking = bookingRes.data.data
      toast.success('Booking created!')

      // 2. Initiate payment
      const paymentRes = await initiatePaymentAPI({ bookingId: booking.id })
      const paymentData = paymentRes.data.data

      // 3. Open Razorpay
      openRazorpay(paymentData, booking.id)

    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const openRazorpay = (paymentData, bookingId) => {
    const options = {
      key:         paymentData.keyId,
      amount:      paymentData.amount,
      currency:    paymentData.currency,
      order_id:    paymentData.orderId,
      name:        'SmartCity Map',
      description: `Booking - ${bookingData.route?.routeName}`,
      handler: async (response) => {
        try {
          // Verify payment
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/verify`, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId,
            }),
          })
          toast.success('Payment successful! Booking confirmed.')
          sessionStorage.removeItem('bookingData')
          router.push('/bookings')
        } catch {
          toast.error('Payment verification failed')
        }
      },
      prefill: {
        name:  '',
        email: '',
        contact: '',
      },
      theme: { color: '#2563eb' },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  if (authLoading || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin text-3xl">🗺️</div>
      </div>
    )
  }

  const { route, trip, stops, travelDate } = bookingData

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Load Razorpay script */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />

      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-white text-2xl font-bold mb-6">
          🎟️ Confirm Booking
        </h1>

        {/* Route summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-semibold text-sm mb-3">Route Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} className="text-green-400" />
              {route?.origin}
              <span className="text-gray-600">→</span>
              <MapPin size={14} className="text-red-400" />
              {route?.destination}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={14} className="text-blue-400" />
              Departure: {trip?.departureTime} on{' '}
              {new Date(travelDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <IndianRupee size={14} className="text-yellow-400" />
              Fare: ₹{bookingData.baseFare}
            </div>
          </div>
        </div>

        {/* Stop selection */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-semibold text-sm mb-4">Select Stops</h2>

          {/* Boarding stop */}
          <div className="mb-4">
            <label className="block text-gray-400 text-xs mb-2">
              Boarding Stop *
            </label>
            <div className="relative">
              <select
                value={boardingStop}
                onChange={(e) => setBoardingStop(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-4 py-3 text-sm appearance-none
                           focus:outline-none focus:border-blue-500"
              >
                <option value="">Select boarding stop</option>
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stopOrder}. {stop.stopName}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Drop stop */}
          <div>
            <label className="block text-gray-400 text-xs mb-2">
              Drop Stop *
            </label>
            <div className="relative">
              <select
                value={dropStop}
                onChange={(e) => setDropStop(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white
                           rounded-xl px-4 py-3 text-sm appearance-none
                           focus:outline-none focus:border-blue-500"
              >
                <option value="">Select drop stop</option>
                {stops.map((stop) => (
                  <option key={stop.id} value={stop.id}>
                    {stop.stopOrder}. {stop.stopName}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Seat number */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="text-white font-semibold text-sm mb-3">
            Seat Number (Optional)
          </h2>
          <div className="flex items-center gap-2">
            <Armchair size={16} className="text-blue-400" />
            <input
              type="text"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              placeholder="e.g. A1, B3 (leave empty for any seat)"
              className="flex-1 bg-gray-800 border border-gray-700 text-white
                         rounded-xl px-4 py-3 text-sm focus:outline-none
                         focus:border-blue-500 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirmBooking}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800
                     disabled:cursor-not-allowed text-white font-semibold
                     rounded-xl py-4 transition text-sm"
        >
          {loading ? 'Creating booking...' : `Pay ₹${bookingData.baseFare} & Confirm`}
        </button>

      </div>
    </div>
  )
}