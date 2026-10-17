import axios from "axios";

const API_URL = (
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:9000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

console.log("==============================");
console.log("SmartCity API URL:", API_URL);
console.log("Environment:", process.env.NODE_ENV);
console.log("==============================");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  console.log("➡️ API REQUEST");
  console.log("Method:", config.method?.toUpperCase());
  console.log("URL:", `${config.baseURL}${config.url}`);

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const isPublicAuthRequest =
      /\/api\/auth\/(?:login|register(?:\/driver)?|forgot-password|reset-password|verify-email|send-verification)\/?$/i.test(
        config.url || "",
      );
    const hasAuthorizationHeader = Boolean(config.headers?.Authorization);

    if (!isPublicAuthRequest && (hasAuthorizationHeader || token)) {
      config._authenticatedWithToken = true;
      if (!hasAuthorizationHeader) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log("Authorization token attached");
    } else if (!token) {
      console.log("No authorization token");
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE");
    console.log("Status:", response.status);
    console.log("URL:", response.config.url);

    return response;
  },
  (error) => {
    const isRejectedLogin =
      error.response?.status === 401 &&
      /\/api\/auth\/login\/?$/i.test(error.config?.url || "");

    if (!isRejectedLogin) {
      console.error("API ERROR");
      console.error("Message:", error.message);
      console.error("URL:", error.config?.url);
      console.error("Base URL:", error.config?.baseURL);
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
    }

    if (
      error.response?.status === 401 &&
      error.config?._authenticatedWithToken
    ) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
