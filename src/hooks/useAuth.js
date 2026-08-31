'use client'
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout, loadFromStorage } from '../store/authSlice'

export const useAuth = () => {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  useEffect(() => {
    if (!auth.isAuthenticated) {
      dispatch(loadFromStorage())
    }
  }, [dispatch, auth.isAuthenticated])

  const llogout = () => {
    dispatch(logout())
  }

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    logout: llogout,
  }
}