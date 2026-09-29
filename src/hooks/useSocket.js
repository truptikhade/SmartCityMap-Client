'use client'
import { useEffect, useRef } from 'react'
import { io }                from 'socket.io-client'
import { useDispatch }       from 'react-redux'
import { updateLiveBus }     from '../store/mapSlice'

export const useSocket = (routeId) => {
  const dispatch  = useDispatch()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!routeId) return

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null

    if (!token) {
      console.warn('useSocket: no token found')
      return
    }

    // Connect
    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
      {
        auth:              { token },
        transports:        ['websocket', 'polling'],
        reconnection:      true,
        reconnectionDelay: 2000,
      }
    )

    socketRef.current.on('connect', () => {
      console.log(' Socket connected:', socketRef.current.id)
      // ← matches tracking.socket.js 'route:join' handler
      socketRef.current.emit('route:join', routeId)
      console.log(` Joined route room: route:${routeId}`)
    })

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message)
    })

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    // ← matches tracking.socket.js + simulator 'vehicle:location' event
    socketRef.current.on('vehicle:location', (data) => {
  if (data.tripId) {
    dispatch(updateLiveBus({
      tripId:      data.tripId,
      lat:         data.lat,
      lng:         data.lng,
      currentStop: data.currentStop,
      nextStop:    data.nextStop,
      speedKmph:   data.speedKmph,
    }))
  }
})

    // Booking cancelled notification
    socketRef.current.on('booking:cancelled', (data) => {
      console.log('Booking cancelled:', data)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('route:leave', routeId)
        socketRef.current.disconnect()
        socketRef.current = null
        console.log(` Left route room: route:${routeId}`)
      }
    }
  }, [routeId, dispatch])

  return socketRef.current
}