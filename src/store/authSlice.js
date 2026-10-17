import { createSlice } from "@reduxjs/toolkit";

const getInitialAuthState = () => {
  return { user: null, token: null, isAuthenticated: false, loading: true };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialAuthState(),
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    },
    loadFromStorage: (state) => {
      state.loading = false;
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          return;
        }

        try {
          const parsedUser = JSON.parse(user);
          if (!parsedUser || typeof parsedUser !== "object") {
            throw new Error("Stored user data is invalid");
          }

          state.token = token;
          state.user = parsedUser;
          state.isAuthenticated = true;
        } catch (error) {
          console.warn("Unable to restore saved authentication:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      }
    },
  },
});

export const { setCredentials, setLoading, logout, loadFromStorage } =
  authSlice.actions;
export default authSlice.reducer;
