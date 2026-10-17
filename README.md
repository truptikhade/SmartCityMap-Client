# SmartCity Map — Next.js Client Application

Live Link: https://smart-city-map-client-six.vercel.app

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

## Production environment

Set `NEXT_PUBLIC_SERVER_URL` in Vercel to the public Railway backend URL,
without a trailing slash or `/api`, then redeploy. A safe template is available
in `.env.example`. Do not put backend secrets in `NEXT_PUBLIC_*` variables.
