'use client'
import { useState, useEffect } from 'react'
import { useDispatch }         from 'react-redux'
import { setUserLocation }     from '../store/mapSlice'

export const useLocation = () => {
  const dispatch = useDispatch()
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      dispatch(setUserLocation({ lat: 19.9975, lng: 73.7898 }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch(setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }))
        setLoading(false)
      },
      () => {
        dispatch(setUserLocation({ lat: 19.9975, lng: 73.7898 }))
        setLoading(false)
      }
    )
  }, [dispatch])

  return { error, loading }
}