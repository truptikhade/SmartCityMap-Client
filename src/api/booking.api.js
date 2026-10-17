import api from "../lib/axios";

export const createBookingAPI = (data, idempotencyKey) =>
  api.post("/api/booking", data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
export const getMyBookingsAPI = () => api.get("/api/booking/my");
export const getBookingByIdAPI = (id) => api.get(`/api/booking/${id}`);
export const getTrainSeatInventoryAPI = (tripId) =>
  api.get(`/api/booking/trips/${tripId}/seats`);
export const cancelBookingAPI = (id) => api.put(`/api/booking/${id}/cancel`);
