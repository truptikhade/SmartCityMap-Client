import { createSlice } from '@reduxjs/toolkit'

const mapSlice = createSlice({
  name: 'map',

  initialState: {
    userLocation: null,
    nearbyPlaces: [],
    selectedPlace: null,
    activeRoute: null,

    // Temporary journey state.
    // This survives client-side navigation,
    // but disappears on a full browser refresh.
    journey: null,
    selectedTransport: null,

    liveBuses: {},
  },

  reducers: {
    setUserLocation: (state, action) => {
      state.userLocation = action.payload
    },

    setNearbyPlaces: (state, action) => {
      state.nearbyPlaces = action.payload
    },

    setSelectedPlace: (state, action) => {
      state.selectedPlace = action.payload
    },

    setActiveRoute: (state, action) => {
      state.activeRoute = action.payload
    },

    // ---------------------------------------------
    // JOURNEY
    // ---------------------------------------------

    setJourney: (state, action) => {
      state.journey = action.payload
    },

    setSelectedTransport: (state, action) => {
      state.selectedTransport = action.payload
    },

    clearJourney: (state) => {
      state.journey = null
      state.selectedTransport = null
      state.selectedPlace = null
      state.activeRoute = null
    },

    // ---------------------------------------------
    // LIVE BUSES
    // ---------------------------------------------

    updateLiveBus: (state, action) => {
      const {
        tripId,
        lat,
        lng,
        currentStop,
        nextStop,
        speedKmph,
      } = action.payload

      state.liveBuses[tripId] = {
        lat,
        lng,
        currentStop,
        nextStop,
        speedKmph,
      }
    },

    clearLiveBuses: (state) => {
      state.liveBuses = {}
    },
  },
})

export const {
  setUserLocation,
  setNearbyPlaces,
  setSelectedPlace,
  setActiveRoute,

  setJourney,
  setSelectedTransport,
  clearJourney,

  updateLiveBus,
  clearLiveBuses,
} = mapSlice.actions

export default mapSlice.reducer