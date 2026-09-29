import { createSlice } from '@reduxjs/toolkit'

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    myBookings:    [],
    selectedTrip:  null,
    selectedSeats: [],
    loading:       false,
  },
  reducers: {
    setMyBookings:   (state, action) => { state.myBookings    = action.payload },
    setSelectedTrip: (state, action) => { state.selectedTrip  = action.payload },
    setSelectedSeat: (state, action) => { state.selectedSeats = action.payload },
    setLoading:      (state, action) => { state.loading       = action.payload },
  },
})

export const { setMyBookings, setSelectedTrip, setSelectedSeat, setLoading } = bookingSlice.actions
export default bookingSlice.reducer