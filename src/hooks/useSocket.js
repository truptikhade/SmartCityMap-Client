"use client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { updateLiveBus } from "../store/mapSlice";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:9000"
).replace(/\/+$/, "");

const AUTH_ERRORS = [
  "Authentication required",
  "Invalid authentication token",
  "Invalid or expired token",
  "User account not found",
  "Your account is deactivated",
];

export const useSocket = (routeId) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!routeId || typeof window === "undefined") return;

    if (!localStorage.getItem("token")) {
      console.warn("useSocket: no token found");
      return;
    }

    const socket = io(SOCKET_URL, {
      // Called on every connect and reconnect, so a refreshed token is used.
      auth: (cb) => cb({ token: localStorage.getItem("token") }),
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      // Runs on the first connect and every reconnect, since rooms
      // are lost when the connection drops.
      socket.emit("route:join", routeId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);

      // Stop retrying when the server rejects the token.
      if (AUTH_ERRORS.includes(err.message)) {
        socket.disconnect();
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("vehicle:location", (data) => {
      if (!data?.tripId) return;

      dispatch(
        updateLiveBus({
          tripId: data.tripId,
          lat: data.lat,
          lng: data.lng,
          currentStop: data.currentStop,
          nextStop: data.nextStop,
          speedKmph: data.speedKmph,
        }),
      );
    });

    socket.on("booking:cancelled", (data) => {
      console.log("Booking cancelled:", data);
    });

    return () => {
      if (socket.connected) {
        socket.emit("route:leave", routeId);
      }
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [routeId, dispatch]);

  return socketRef;
};
