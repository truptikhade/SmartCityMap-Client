"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import { useAuth } from "../../hooks/useAuth";
import { logout, setCredentials } from "../../store/authSlice";

import {
  deleteAccountAPI,
  getProfileAPI,
  updateProfileAPI,
} from "../../api/auth.api";

import Navbar from "../../components/ui/Navbar";
import api from "../../lib/axios";

import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [bookingCount, setBookingCount] = useState(0);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    homeAddress: "",
  });

  /* ======
     MOUNTED
     ====== */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ======
     AUTHENTICATION + ROLE REDIRECT
     ====== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role === "driver") {
      router.replace("/driver");
    }
  }, [authLoading, isAuthenticated, user, router]);

  /* ======
     LOAD PROFILE
     ====== */

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role === "driver") {
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const res = await getProfileAPI();

        const data = res?.data?.data;

        setProfile(data);

        setFormData({
          fname: data?.fname || "",
          lname: data?.lname || "",
          homeAddress: data?.homeAddress || "",
        });
      } catch (error) {
        console.error("Profile loading error:", error);

        toast.error(error?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, isAuthenticated, user]);

  /* ======
     LOAD BOOKING COUNT
     ====== */

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role === "driver") {
      return;
    }

    const fetchBookingCount = async () => {
      try {
        const res = await api.get("/api/booking/my");

        const bookings =
          res?.data?.data || res?.data?.bookings || res?.data || [];

        if (Array.isArray(bookings)) {
          setBookingCount(bookings.length);
          return;
        }

        if (Array.isArray(bookings?.items)) {
          setBookingCount(bookings.items.length);
          return;
        }

        setBookingCount(0);
      } catch (error) {
        console.error("Booking count loading error:", error);

        setBookingCount(0);
      }
    };

    fetchBookingCount();
  }, [authLoading, isAuthenticated, user]);

  /* ======
     SAVE PROFILE
     ====== */

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await updateProfileAPI(formData);

      const updatedProfile = res?.data?.data;

      setProfile(updatedProfile);

      dispatch(
        setCredentials({
          user: updatedProfile,
          token: localStorage.getItem("token"),
        }),
      );

      setEditing(false);

      toast.success("Profile updated!");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ======
     CANCEL EDITING
     ====== */

  const handleCancel = () => {
    setFormData({
      fname: profile?.fname || "",
      lname: profile?.lname || "",
      homeAddress: profile?.homeAddress || "",
    });

    setEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Deactivate your account? You will be signed out and will no longer be able to log in. Your account records will be retained.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAccountAPI({ currentPassword });
      dispatch(logout());
      toast.success("Your account has been deactivated");
      router.replace("/login");
    } catch (error) {
      console.error("Account deactivation error:", error);
      toast.error(
        error?.response?.data?.message || "Unable to deactivate account",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ======
     LOADING
     ====== */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  /* ======
     DRIVER
     ====== */

  if (user?.role === "driver") {
    return null;
  }

  /* ======
     NO PROFILE
     ====== */

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-sm text-gray-500 shadow-sm">
            Profile information is unavailable.
          </div>
        </div>
      </div>
    );
  }

  const initials = `${profile.fname?.[0] || ""}${
    profile.lname?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/*
          NAVBAR
           */}

      <Navbar />

      {/*
          PROFILE CONTENT
           */}

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="space-y-6">
          <section className="relative isolate overflow-hidden rounded-3xl bg-mauve-950 px-6 py-8 text-white shadow-xl shadow-mauve-950/10 sm:px-9 sm:py-10 lg:px-12">
            <div className="absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full bg-mauve-700/50 blur-3xl" />
            <div className="absolute -bottom-36 right-1/3 -z-10 h-72 w-72 rounded-full bg-rose-300/10 blur-3xl" />
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-mauve-100">
                  <Sparkles size={14} />
                  YOUR SMARTCITY ACCOUNT
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your space,
                  <span className="mt-1 block text-mauve-200">
                    your way around the city.
                  </span>
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-mauve-100/75 sm:text-base">
                  Keep your details up to date and your next city journey close
                  at hand.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-mauve-900 shadow-sm transition hover:bg-mauve-50"
                >
                  Plan a trip <ArrowRight size={16} />
                </button>
              </div>

              <div className="relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur sm:min-w-[18rem] sm:p-6">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/10" />
                <div className="absolute -right-2 -top-4 h-20 w-20 rounded-full border border-white/10" />
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-bold text-mauve-800 shadow-lg shadow-black/10">
                  {initials || <User size={26} />}
                </div>
                <div className="relative min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-mauve-100/65">
                    Welcome back
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold">
                    {mounted
                      ? `${profile.fname} ${profile.lname || ""}`.trim()
                      : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium capitalize text-mauve-100">
                      {profile.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-mauve-100/75">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          profile.isActive === false
                            ? "bg-red-300"
                            : "bg-emerald-300"
                        }`}
                      />
                      {profile.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            {/* ==================================================
              PROFILE HEADER
              ================================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                {/* USER */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mauve-700 text-2xl font-bold text-white shadow-sm shadow-mauve-700/20">
                      {initials || <User size={28} />}
                    </div>

                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold text-gray-950">
                      {mounted
                        ? `${profile.fname} ${profile.lname || ""}`.trim()
                        : ""}
                    </h1>

                    <span
                      className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        profile.role === "admin"
                          ? "border-mauve-200 bg-mauve-50 text-mauve-700"
                          : "border-mauve-200 bg-mauve-50 text-mauve-700"
                      }`}
                    >
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* EDIT / SAVE */}
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 rounded-xl border border-mauve-200 bg-mauve-50 px-3 py-2 text-sm font-medium text-mauve-800 transition hover:bg-mauve-100"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-950"
                    >
                      <X size={14} />
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-lg bg-mauve-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-mauve-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={14} />

                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* ==================================================
                PROFILE FIELDS
                ================================================== */}

              <div className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mauve-50 text-mauve-700">
                  <User size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Personal details
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Keep your contact information current
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* FIRST + LAST NAME */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* FIRST NAME */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      First Name
                    </label>

                    {editing ? (
                      <input
                        type="text"
                        value={formData.fname}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            fname: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User size={14} className="text-gray-400" />

                        {mounted ? profile.fname : ""}
                      </div>
                    )}
                  </div>

                  {/* LAST NAME */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Last Name
                    </label>

                    {editing ? (
                      <input
                        type="text"
                        value={formData.lname}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            lname: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User size={14} className="text-gray-400" />

                        {mounted ? profile.lname || "—" : ""}
                      </div>
                    )}
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Email
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <Mail size={14} className="text-gray-400" />

                    {mounted ? profile.email : ""}
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Phone
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <Phone size={14} className="text-gray-400" />

                    {mounted ? profile.phone : ""}
                  </div>
                </div>

                {/* HOME ADDRESS */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">
                    Home Address
                  </label>

                  {editing ? (
                    <input
                      type="text"
                      value={formData.homeAddress}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          homeAddress: event.target.value,
                        })
                      }
                      placeholder="Enter your home address"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <MapPin size={14} className="text-gray-400" />

                      {mounted ? profile.homeAddress || "Not set" : ""}
                    </div>
                  )}
                </div>
              </div>
            </section>
            {/* ==================================================
              ACCOUNT INFO
              ================================================== */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mauve-50 text-mauve-700">
                  <Shield size={17} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-950">
                    Account Info
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Your account standing and activity
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* VERIFICATION */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Verification</span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      profile.isVerified
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-yellow-200 bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {profile.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>

                {/* ACCOUNT STATUS */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Account Status</span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                      profile.isActive === false
                        ? "border-mauve-200 bg-mauve-50 text-mauve-700"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {profile.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>

                {/* MEMBER SINCE */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Member Since</span>

                  <span className="text-sm font-medium text-gray-900">
                    {mounted && profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </span>
                </div>

                {/* LAST LOGIN */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">Last Login</span>

                  <span className="text-sm font-medium text-gray-900">
                    {mounted && profile.lastLogin
                      ? new Date(profile.lastLogin).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-mauve-200 bg-white p-5 flex flex-col gap-3 shadow-sm">
              <h2 className="text-sm font-semibold text-mauve-700">
                Deactivate account
              </h2>
              <p className="text-sm text-gray-600">
                Your account will be disabled and you will be signed out. Your
                bookings, reviews, and other records will be retained.
              </p>
              <div>
                <label
                  htmlFor="delete-account-password"
                  className="block text-xs font-medium text-gray-600"
                >
                  Confirm your password
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-mauve-400 focus:ring-2 focus:ring-mauve-100 sm:max-w-sm"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || !currentPassword}
                  className="rounded-lg bg-mauve-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-mauve-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deactivating..." : "Deactivate my account"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
