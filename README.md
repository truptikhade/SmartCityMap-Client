# SmartCity Map — Next.js Client Application

AI-Powered Urban Transit & Navigation Frontend built with **Next.js 16 (App Router)**, **React 19**, **Redux Toolkit**, **Tailwind CSS**, and **Leaflet.js**.

---

## Tech Stack & Features

* **Framework:** Next.js 16 (App Router) & React 19
* **State Management:** Redux Toolkit
* **Styling:** Tailwind CSS (Dark theme design system)
* **Maps & Geo:** Leaflet.js & React-Leaflet
* **Notifications:** React Hot Toast
* **Real-time Updates:** Socket.io Client

---

## Project Structure

```text
client/
├── src/
│   ├── app/                  # Next.js App Router pages (map, transit, bookings, profile)
│   ├── components/           # UI components (Map, PlaceCards, BookingModal, Navbar)
│   ├── store/                # Redux slices (auth, transit, map, booking)
│   ├── services/             # API client services & Axios configuration
│   ├── hooks/                # Custom React hooks (useGeolocation, useSocket)
│   └── types/                # TypeScript interfaces & types
├── public/                   # Map markers, icons, static assets
├── .env.local.example        # Local configuration template
└── package.json
