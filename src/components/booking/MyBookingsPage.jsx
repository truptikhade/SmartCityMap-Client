"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Car,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Ticket,
  TrainFront,
  BusFront,
  X,
  ArrowRight,
  Compass,
  Route,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuth } from "../../hooks/useAuth";
import { cancelBookingAPI, getMyBookingsAPI } from "../../api/booking.api";
import { getPassengerRidesAPI, cancelRideAPI } from "../../api/ride.api";

import Navbar from "../ui/Navbar";

const bookingStatusClass = {
  confirmed: "bg-green-50 text-green-700",
  pending: "bg-yellow-50 text-yellow-700",
  cancelled: "bg-red-50 text-red-700",
  completed: "bg-gray-100 text-gray-600",
};

const rideStatusClass = {
  REQUESTED: "bg-yellow-50 text-yellow-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  DRIVER_ARRIVING: "bg-blue-50 text-blue-700",
  DRIVER_ARRIVED: "bg-indigo-50 text-indigo-700",
  OTP_VERIFIED: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const vehicleLabels = {
  car: "Car",
  auto: "Auto",
  twoWheeler: "Two Wheeler",
};

export default function MyBookingsPage() {
  const router = useRouter();

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadBookings = async () => {
      setLoading(true);

      try {
        const [bookingResult, rideResult] = await Promise.allSettled([
          getMyBookingsAPI(),
          getPassengerRidesAPI(),
        ]);

        if (bookingResult.status === "fulfilled") {
          setBookings(bookingResult.value.data?.data || []);
        } else {
          console.error("Could not load transit bookings:", bookingResult.reason);
          toast.error(
            "Transit bookings are temporarily unavailable. Please try again later.",
          );
        }

        if (rideResult.status === "fulfilled") {
          setRides(rideResult.value?.data || []);
        } else {
          console.error("Could not load rides:", rideResult.reason);
          toast.error(
            "Ride history is temporarily unavailable. Please try again later.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [isAuthenticated]);

  const combinedTrips = useMemo(() => {
    const transitItems = bookings.map((booking) => ({
      ...booking,
      recordType: "transit",
      sortDate: booking.bookedAt || booking.travelDate || null,
    }));

    const rideItems = rides.map((ride) => ({
      ...ride,
      recordType: "ride",
      sortDate: ride.requestedAt || ride.acceptedAt || null,
    }));

    return [...transitItems, ...rideItems].sort((a, b) => {
      const first = a.sortDate ? new Date(a.sortDate).getTime() : 0;

      const second = b.sortDate ? new Date(b.sortDate).getTime() : 0;

      return second - first;
    });
  }, [bookings, rides]);

  const cancelTransitBooking = async (bookingId) => {
    try {
      await cancelBookingAPI(bookingId);

      setBookings((items) =>
        items.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                status: "cancelled",
              }
            : item,
        ),
      );

      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel booking");
    }
  };

  const cancelOnDemandRide = async (rideId) => {
    try {
      await cancelRideAPI(rideId);

      setRides((items) =>
        items.map((item) =>
          item.id === rideId
            ? {
                ...item,
                status: "CANCELLED",
              }
            : item,
        ),
      );

      toast.success("Ride cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel ride");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={22} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative isolate overflow-hidden rounded-3xl bg-mauve-950 px-6 py-8 text-white shadow-xl shadow-mauve-950/10 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute -right-12 -top-28 -z-10 h-80 w-80 rounded-full bg-mauve-700/50 blur-3xl" />
          <div className="absolute -bottom-36 right-1/3 -z-10 h-72 w-72 rounded-full bg-rose-300/10 blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-mauve-100">
                <Sparkles size={14} />
                YOUR TRAVEL DASHBOARD
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                Every trip has a story.
                <span className="mt-1 block text-mauve-200">
                  Start your next one.
                </span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-mauve-100/75 sm:text-base">
                Keep your rides and transit bookings together, and get back on
                the road whenever you’re ready.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-mauve-900 shadow-sm transition hover:bg-mauve-50"
                >
                  Plan a trip <ArrowRight size={16} />
                </button>
                <div className="inline-flex items-center gap-2 px-2 text-sm text-mauve-100/70">
                  <Route size={16} />
                  {combinedTrips.length
                    ? `${combinedTrips.length} trip${combinedTrips.length === 1 ? "" : "s"} saved`
                    : "Your trips, all in one place"}
                </div>
              </div>
            </div>

            <div className="relative mx-auto hidden h-52 w-full max-w-md lg:block">
              <div className="absolute inset-3 rotate-[-5deg] rounded-[2rem] border border-white/10 bg-white/[0.06]" />
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.08]">
                <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(35deg,transparent_48%,rgba(255,255,255,.14)_49%,rgba(255,255,255,.14)_50%,transparent_51%),linear-gradient(145deg,transparent_45%,rgba(255,255,255,.10)_46%,rgba(255,255,255,.10)_47%,transparent_48%)] [background-size:78px_78px]" />
                <div className="absolute left-[18%] top-[22%] flex items-center gap-2 rounded-xl border border-white/15 bg-mauve-950/75 px-3 py-2 shadow-lg backdrop-blur">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-mauve-100">
                    <Compass size={17} />
                  </span>
                  <span>
                    <span className="block text-[10px] text-mauve-100/60">
                      PICK A PLACE
                    </span>
                    <span className="block text-xs font-medium">Your city</span>
                  </span>
                </div>
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 420 208"
                  fill="none"
                >
                  <path
                    d="M85 66C130 66 119 137 184 137C238 137 224 78 286 78C318 78 320 112 348 112"
                    stroke="#E6D7E2"
                    strokeWidth="3"
                    strokeDasharray="7 8"
                  />
                  <circle cx="85" cy="66" r="7" fill="white" />
                  <circle cx="348" cy="112" r="8" fill="#D3BBCE" />
                  <circle cx="348" cy="112" r="14" stroke="#D3BBCE" strokeOpacity=".35" />
                </svg>
                <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3 text-mauve-950 shadow-xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mauve-100 text-mauve-700">
                    <Car size={21} />
                  </span>
                  <span>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-mauve-500">
                      READY WHEN YOU ARE
                    </span>
                    <span className="block text-sm font-semibold">
                      Let’s get moving
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mauve-600">
              Your activity
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">
              Recent trips
            </h2>
          </div>
          {combinedTrips.length > 0 && (
            <span className="rounded-full border border-mauve-200 bg-white px-3 py-1.5 text-xs font-medium text-mauve-700">
              {combinedTrips.length} total
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {combinedTrips.length === 0 ? (
            <EmptyBookings onPlanTrip={() => router.push("/")} />
          ) : (
            combinedTrips.slice(0, 5).map((item) =>
              item.recordType === "transit" ? (
                <TransitBookingCard
                  key={`booking-${item.id}`}
                  booking={item}
                  onCancel={cancelTransitBooking}
                />
              ) : (
                <RideBookingCard
                  key={`ride-${item.id}`}
                  ride={item}
                  onCancel={cancelOnDemandRide}
                />
              ),
            )
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyBookings({ onPlanTrip }) {
  return (
    <div className="grid overflow-hidden rounded-3xl border border-mauve-100 bg-white shadow-sm md:grid-cols-[0.8fr_1.2fr]">
      <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-mauve-50 p-8 md:min-h-72">
        <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-white/80" />
        <div className="absolute bottom-7 right-8 h-32 w-32 rounded-full bg-mauve-100/80" />
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-mauve-200/80 bg-white/70 shadow-inner">
          <div className="absolute inset-4 rounded-full border border-dashed border-mauve-300" />
          <div className="absolute left-7 top-7 flex h-9 w-9 items-center justify-center rounded-full bg-mauve-100 text-mauve-700">
            <MapPin size={17} />
          </div>
          <div className="absolute bottom-7 right-7 flex h-9 w-9 items-center justify-center rounded-full bg-mauve-700 text-white shadow-md shadow-mauve-700/20">
            <Car size={17} />
          </div>
          <Route size={34} strokeWidth={1.4} className="text-mauve-400" />
        </div>
      </div>
      <div className="flex flex-col justify-center px-6 py-8 sm:px-10 md:py-12">
        <span className="w-fit rounded-full bg-mauve-50 px-3 py-1 text-xs font-semibold text-mauve-700">
          A fresh start
        </span>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
          No trips on your list. Yet.
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
          Your booked rides and transit journeys will show up here. Find a
          destination and we’ll help you figure out how to get there.
        </p>
        <button
          type="button"
          onClick={onPlanTrip}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-mauve-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-mauve-800 focus:outline-none focus:ring-2 focus:ring-mauve-500 focus:ring-offset-2"
        >
          Explore trips <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function TransitBookingCard({ booking, onCancel }) {
  const status = booking.status?.toLowerCase();

  const transitType = booking.transitType?.toLowerCase();

  const isBus = transitType === "bus";

  const canCancel = status === "confirmed" || status === "pending";

  return (
    <article className="border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {isBus ? <BusFront size={18} /> : <TrainFront size={18} />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-gray-900">
                {booking.route?.routeName || "Transit booking"}
              </h2>

              <span className="shrink-0 text-[11px] font-medium capitalize text-gray-400">
                {transitType || "transit"}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />

              {booking.boardingStop?.stopName || "Boarding"}

              <span>-</span>

              {booking.dropStop?.stopName || "Drop"}
            </p>
          </div>
        </div>

        <StatusBadge status={booking.status} classMap={bookingStatusClass} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          icon={<CalendarDays size={13} />}
          label="Travel date"
          value={booking.travelDate ? formatDate(booking.travelDate) : "—"}
        />

        <Detail
          icon={<Clock3 size={13} />}
          label="Departure"
          value={booking.trip?.departureTime || "—"}
        />

        <Detail
          icon={<IndianRupee size={13} />}
          label="Fare"
          value={`₹${Math.round(Number(booking.farePaid || 0))}`}
        />
      </div>

      {booking.seatNumber && (
        <div className="mt-3 text-xs text-gray-500">
          Seat{" "}
          <span className="font-medium text-gray-700">
            {booking.seatNumber}
          </span>
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(booking.id)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
        >
          <X size={13} />
          Cancel booking
        </button>
      )}
    </article>
  );
}

function RideBookingCard({ ride, onCancel }) {
  const vehicleType = ride.vehicleType || "car";

  const vehicleLabel = vehicleLabels[vehicleType] || vehicleType;

  const status = String(ride.status || "").toUpperCase();

  const canCancel = [
    "REQUESTED",
    "ACCEPTED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
  ].includes(status);

  const driverName = [ride.driver?.fname, ride.driver?.lname]
    .filter(Boolean)
    .join(" ");

  const distance =
    ride.distanceKm != null ? `${Number(ride.distanceKm).toFixed(1)} km` : "—";

  const duration =
    ride.durationMinutes != null
      ? `${Math.round(Number(ride.durationMinutes))} min`
      : "—";

  const fare = ride.finalFare ?? ride.estimatedFare ?? 0;

  return (
    <article className="border border-gray-200 bg-white p-5 transition hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Car size={18} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                {vehicleLabel} ride
              </h2>

              {ride.vehicle?.vehicleNumber && (
                <span className="truncate text-[11px] text-gray-400">
                  {ride.vehicle.vehicleNumber}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />

              <span className="truncate">{ride.pickupAddress || "Pickup"}</span>

              <span>-</span>

              <span className="truncate">
                {ride.destinationAddress || "Destination"}
              </span>
            </p>
          </div>
        </div>

        <StatusBadge status={status} classMap={rideStatusClass} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          icon={<CalendarDays size={13} />}
          label="Requested"
          value={ride.requestedAt ? formatDateTime(ride.requestedAt) : "—"}
        />

        <Detail icon={<Clock3 size={13} />} label="Duration" value={duration} />

        <Detail
          icon={<IndianRupee size={13} />}
          label="Fare"
          value={`₹${Math.round(Number(fare))}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
        <span>
          Distance <span className="font-medium text-gray-700">{distance}</span>
        </span>

        {driverName && (
          <span>
            Driver{" "}
            <span className="font-medium text-gray-700">{driverName}</span>
          </span>
        )}

        {ride.driver?.phone && <span>{ride.driver.phone}</span>}
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(ride.id)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-red-600 transition hover:text-red-700"
        >
          <X size={13} />
          Cancel ride
        </button>
      )}
    </article>
  );
}

function StatusBadge({ status, classMap }) {
  const normalized = String(status || "").toLowerCase();

  const className =
    classMap[status] || classMap[normalized] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return String(status)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
