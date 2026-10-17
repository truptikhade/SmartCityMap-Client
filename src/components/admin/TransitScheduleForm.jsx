"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createTransitScheduleAPI } from "../../api/admin.api";

const todayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createStop = () => ({
  stopName: "",
  stopCode: "",
  lat: "",
  lng: "",
  arrivalTime: "",
  departureTime: "",
  distanceFromPrevKm: "",
});

const initialForm = () => ({
  transitType: "bus",
  routeName: "",
  routeNumber: "",
  origin: "",
  destination: "",
  baseFare: "",
  travelDate: todayDate(),
  vehicleNumber: "",
  departureTime: "",
  arrivalTime: "",
  driverName: "",
  driverPhone: "",
  totalSeats: "",
  stops: [createStop(), createStop()],
});

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-500";
const labelClass = "block text-sm text-gray-300";

export default function TransitScheduleForm() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateStop = (index, event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      stops: current.stops.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, [name]: value } : stop,
      ),
    }));
  };

  const addStop = () => {
    setForm((current) => ({
      ...current,
      stops: [
        ...current.stops.slice(0, -1),
        createStop(),
        current.stops[current.stops.length - 1],
      ],
    }));
  };

  const removeStop = (index) => {
    setForm((current) => ({
      ...current,
      stops: current.stops.filter((_, stopIndex) => stopIndex !== index),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const stops = form.stops.map((stop, index) => ({
      stopName:
        index === 0
          ? form.origin.trim()
          : index === form.stops.length - 1
            ? form.destination.trim()
            : stop.stopName.trim(),
      stopCode: stop.stopCode.trim() || null,
      stopOrder: index + 1,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
      arrivalTime: stop.arrivalTime || null,
      departureTime: stop.departureTime || null,
      distanceFromPrevKm:
        stop.distanceFromPrevKm === "" ? null : Number(stop.distanceFromPrevKm),
    }));

    try {
      await createTransitScheduleAPI({
        transitType: form.transitType,
        routeName: form.routeName.trim(),
        routeNumber: form.routeNumber.trim(),
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        baseFare: Number(form.baseFare),
        travelDate: form.travelDate,
        vehicleNumber: form.vehicleNumber.trim(),
        departureTime: form.departureTime,
        arrivalTime: form.arrivalTime || null,
        driverName: form.driverName.trim() || null,
        driverPhone: form.driverPhone.trim() || null,
        totalSeats: Number(form.totalSeats),
        stops,
      });
      toast.success("Transit schedule created");
      setForm(initialForm());
    } catch (error) {
      console.error("Create transit schedule error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create transit schedule",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add bus or train service</h2>
        <p className="mt-1 text-sm text-gray-500">
        Create a route with ordered stops and a dated trip. To schedule this
        route on another date, submit the same route number and route details
        again with the new travel date.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-7">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-200">
            Route details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Service type
              <select
                name="transitType"
                value={form.transitType}
                onChange={updateField}
                className={inputClass}
              >
                <option value="bus">Bus</option>
                <option value="train">Train</option>
              </select>
            </label>
            <label className={labelClass}>
              Route name
              <input
                name="routeName"
                value={form.routeName}
                onChange={updateField}
                className={inputClass}
                required
                maxLength={120}
                placeholder="RouteName"
              />
            </label>
            <label className={labelClass}>
              Route number (must be unique)
              <input
                name="routeNumber"
                value={form.routeNumber}
                onChange={updateField}
                className={inputClass}
                required
                maxLength={30}
              />
            </label>
            <label className={labelClass}>
              Origin
              <input
                name="origin"
                value={form.origin}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
            <label className={labelClass}>
              Destination
              <input
                name="destination"
                value={form.destination}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
            <label className={labelClass}>
              Base fare (₹)
              <input
                name="baseFare"
                type="number"
                min="0"
                step="0.01"
                value={form.baseFare}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-200">
            Trip schedule
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Travel date
              <input
                name="travelDate"
                type="date"
                min={todayDate()}
                value={form.travelDate}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
            <label className={labelClass}>
              Vehicle / train number
              <input
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={updateField}
                className={inputClass}
                required
                maxLength={40}
              />
            </label>
            <label className={labelClass}>
              Departure time
              <input
                name="departureTime"
                type="text"
                inputMode="numeric"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                title="Enter time in 24-hour format, for example 13:30"
                value={form.departureTime}
                onChange={updateField}
                className={inputClass}
                required
                maxLength={5}
                placeholder="HH:MM"
              />
            </label>
            <label className={labelClass}>
              Arrival time
              <input
                name="arrivalTime"
                type="text"
                inputMode="numeric"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                title="Enter time in 24-hour format, for example 13:30"
                value={form.arrivalTime}
                onChange={updateField}
                className={inputClass}
                maxLength={5}
                placeholder="HH:MM"
              />
            </label>
            <label className={labelClass}>
              Driver / operator (optional)
              <input
                name="driverName"
                value={form.driverName}
                onChange={updateField}
                className={inputClass}
                maxLength={100}
              />
            </label>
            <label className={labelClass}>
              Operator phone (optional)
              <input
                name="driverPhone"
                type="tel"
                value={form.driverPhone}
                onChange={updateField}
                className={inputClass}
                maxLength={30}
              />
            </label>
            <label className={labelClass}>
              Total seats
              <input
                name="totalSeats"
                type="number"
                min="1"
                max="10000"
                step="1"
                value={form.totalSeats}
                onChange={updateField}
                className={inputClass}
                required
              />
            </label>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-200">
                Route stops
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Enter accurate coordinates. The first and last stop use the
                route origin and destination. Add intermediate stops to make
                the map path follow the route more closely.
              </p>
            </div>
            <button
              type="button"
              onClick={addStop}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              <Plus size={15} />
              Add stop
            </button>
          </div>

          <div className="space-y-3">
            {form.stops.map((stop, index) => {
              const isEndpoint = index === 0 || index === form.stops.length - 1;
              const stopTitle =
                index === 0
                  ? `Origin: ${form.origin || "set origin above"}`
                  : index === form.stops.length - 1
                    ? `Destination: ${form.destination || "set destination above"}`
                    : `Stop ${index + 1}`;

              return (
                <div
                  key={`stop-${index}`}
                  className="rounded-xl border border-gray-800 bg-gray-950/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-200">
                      {stopTitle}
                    </h4>
                    {!isEndpoint && (
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        aria-label={`Remove stop ${index + 1}`}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-red-950/50 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {!isEndpoint && (
                      <label className={labelClass}>
                        Stop name
                        <input
                          name="stopName"
                          value={stop.stopName}
                          onChange={(event) => updateStop(index, event)}
                          className={inputClass}
                          required
                        />
                      </label>
                    )}
                    <label className={labelClass}>
                      Stop code (optional)
                      <input
                        name="stopCode"
                        value={stop.stopCode}
                        onChange={(event) => updateStop(index, event)}
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      Latitude
                      <input
                        name="lat"
                        type="number"
                        min="-90"
                        max="90"
                        step="any"
                        value={stop.lat}
                        onChange={(event) => updateStop(index, event)}
                        className={inputClass}
                        required
                      />
                    </label>
                    <label className={labelClass}>
                      Longitude
                      <input
                        name="lng"
                        type="number"
                        min="-180"
                        max="180"
                        step="any"
                        value={stop.lng}
                        onChange={(event) => updateStop(index, event)}
                        className={inputClass}
                        required
                      />
                    </label>
                    <label className={labelClass}>
                      Arrival time
                      <input
                        name="arrivalTime"
                        type="text"
                        inputMode="numeric"
                        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                        title="Enter time in 24-hour format, for example 13:30"
                        value={stop.arrivalTime}
                        onChange={(event) => updateStop(index, event)}
                        className={inputClass}
                        maxLength={5}
                        placeholder="HH:MM"
                      />
                    </label>
                    <label className={labelClass}>
                      Departure time
                      <input
                        name="departureTime"
                        type="text"
                        inputMode="numeric"
                        pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                        title="Enter time in 24-hour format, for example 13:30"
                        value={stop.departureTime}
                        onChange={(event) => updateStop(index, event)}
                        className={inputClass}
                        maxLength={5}
                        placeholder="HH:MM"
                      />
                    </label>
                    {index > 0 && (
                      <label className={labelClass}>
                        Distance from previous stop (km)
                        <input
                          name="distanceFromPrevKm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={stop.distanceFromPrevKm}
                          onChange={(event) => updateStop(index, event)}
                          className={inputClass}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving schedule..." : "Create schedule"}
          </button>
          <p className="text-xs text-gray-500">
            Matching route numbers reuse the existing route and add another
            dated trip. Conflicting route details are rejected.
          </p>
        </div>
      </form>
    </section>
  );
}
