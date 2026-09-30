'use client'

import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserLocation } from '../store/mapSlice'

export const useLocation = () => {
  const dispatch = useDispatch()

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setLoading(false)
      dispatch(setUserLocation(null))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        console.log('Current location:', {
          latitude,
          longitude,
          accuracy,
        })

        dispatch(
          setUserLocation({
            lat: latitude,
            lng: longitude,
          })
        )

        setError(null)
        setLoading(false)
      },
      (error) => {
        console.error('Geolocation error:', {
          code: error.code,
          message: error.message,
        })

        setError(error.message)
        setLoading(false)

        // Do NOT use a fake Nashik location
        dispatch(setUserLocation(null))
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [dispatch])

  return {
    error,
    loading,
  }
}