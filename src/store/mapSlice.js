import { createSlice } from '@reduxjs/toolkit'

const mapSlice = createSlice({
  name: 'map',
  initialState: {
    userLocation:  null,
    nearbyPlaces:  [],
    selectedPlace: null,
    activeRoute:   null,
    liveBuses:     {},
  },
  reducers: {
    setUserLocation:  (state, action) => { state.userLocation  = action.payload },
    setNearbyPlaces:  (state, action) => { state.nearbyPlaces  = action.payload },
    setSelectedPlace: (state, action) => { state.selectedPlace = action.payload },
    setActiveRoute:   (state, action) => { state.activeRoute   = action.payload },
    updateLiveBus: (state, action) => {
      const { tripId, lat, lng, currentStop, nextStop, speedKmph } = action.payload
      state.liveBuses[tripId] = { lat, lng, currentStop, nextStop, speedKmph }
    },
    clearLiveBuses: (state) => { state.liveBuses = {} },
  },
})

export const {
  setUserLocation, setNearbyPlaces, setSelectedPlace,
  setActiveRoute, updateLiveBus, clearLiveBuses,
} = mapSlice.actions
export default mapSlice.reducer