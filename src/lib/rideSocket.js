'use client'

import { io } from 'socket.io-client'

const SOCKET_URL =
  process.env.SERVER_URL?.replace(
    /\/api\/?$/,
    ''
  ) || 'http://localhost:9000'

let rideSocket = null

// --------------------------------------------------
// Get authentication token
// --------------------------------------------------

const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    null
  )
}

// --------------------------------------------------
// Get Socket
// --------------------------------------------------

export const getRideSocket = () => {
  if (!rideSocket) {
    rideSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],

      autoConnect: false,

      auth: {
        token: getAuthToken(),
      },
    })

    rideSocket.on(
      'connect_error',
      (error) => {
        console.error(
          '[browser] Driver socket connection error:',
          error
        )
      }
    )
  }

  return rideSocket
}

// --------------------------------------------------
// Connect Driver
// --------------------------------------------------

export const connectDriverSocket = ({
  driverId,
  vehicleType,
}) => {
  const socket = getRideSocket()

  if (!driverId || !vehicleType) {
    console.error(
      'Driver socket: driverId and vehicleType are required'
    )

    return socket
  }

  const token = getAuthToken()

  if (!token) {
    console.error(
      'Driver socket: authentication token not found'
    )

    return socket
  }

  // Refresh authentication token before connecting.
  socket.auth = {
    token,
  }

  const registerDriver = () => {
    socket.emit(
      'driver:online',
      {
        driverId,
        vehicleType,
      }
    )
  }

  if (socket.connected) {
    registerDriver()
  } else {
    socket.once(
      'connect',
      registerDriver
    )

    socket.connect()
  }

  return socket
}

// --------------------------------------------------
// Connect Passenger
// --------------------------------------------------

export const connectPassengerSocket = ({
  passengerId,
}) => {
  const socket = getRideSocket()

  if (!passengerId) {
    console.error(
      'Passenger socket: passengerId is required'
    )

    return socket
  }

  const token = getAuthToken()

  if (!token) {
    console.error(
      'Passenger socket: authentication token not found'
    )

    return socket
  }

  socket.auth = {
    token,
  }

  const registerPassenger = () => {
    socket.emit(
      'passenger:join',
      {
        passengerId,
      }
    )
  }

  if (socket.connected) {
    registerPassenger()
  } else {
    socket.once(
      'connect',
      registerPassenger
    )

    socket.connect()
  }

  return socket
}

// --------------------------------------------------
// Disconnect Driver
// --------------------------------------------------

export const disconnectDriverSocket = () => {
  if (!rideSocket) {
    return
  }

  if (rideSocket.connected) {
    rideSocket.emit(
      'driver:offline'
    )

    rideSocket.disconnect()
  }
}

// --------------------------------------------------
// Disconnect Passenger
// --------------------------------------------------

export const disconnectPassengerSocket = () => {
  if (!rideSocket) {
    return
  }

  if (rideSocket.connected) {
    rideSocket.disconnect()
  }
}

// --------------------------------------------------
// Listen for New Ride Requests
// --------------------------------------------------

export const onNewRideRequest = (
  callback
) => {
  const socket = getRideSocket()

  socket.on(
    'ride:new_request',
    callback
  )

  return () => {
    socket.off(
      'ride:new_request',
      callback
    )
  }
}

// --------------------------------------------------
// Listen for Ride Updates
// --------------------------------------------------

export const onRideUpdated = (
  callback
) => {
  const socket = getRideSocket()

  socket.on(
    'ride:updated',
    callback
  )

  return () => {
    socket.off(
      'ride:updated',
      callback
    )
  }
}

// --------------------------------------------------
// Socket Connection Events
// --------------------------------------------------

export const onSocketConnect = (
  callback
) => {
  const socket = getRideSocket()

  socket.on(
    'connect',
    callback
  )

  return () => {
    socket.off(
      'connect',
      callback
    )
  }
}

// --------------------------------------------------
// Socket Disconnect Events
// --------------------------------------------------

export const onSocketDisconnect = (
  callback
) => {
  const socket = getRideSocket()

  socket.on(
    'disconnect',
    callback
  )

  return () => {
    socket.off(
      'disconnect',
      callback
    )
  }
}

// --------------------------------------------------
// Socket Error
// --------------------------------------------------

export const onSocketError = (
  callback
) => {
  const socket = getRideSocket()

  socket.on(
    'connect_error',
    callback
  )

  return () => {
    socket.off(
      'connect_error',
      callback
    )
  }
}

// --------------------------------------------------
// Default Export
// --------------------------------------------------

export default getRideSocket