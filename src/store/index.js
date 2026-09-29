import { configureStore } from '@reduxjs/toolkit'
import authReducer    from './authSlice'
import mapReducer     from './mapSlice'
import bookingReducer from './bookingSlice'

export const store = configureStore({
  reducer: {
    auth:    authReducer,
    map:     mapReducer,
    booking: bookingReducer,
  },
})