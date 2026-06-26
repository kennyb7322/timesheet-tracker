# UCS Rides 🚗

A mobile-first rideshare app by **UC Solutions** — book a single trip like Uber/Lyft,
**or hire a driver by the hour** for multiple stops and extended time. Pay with
**Cash App, Venmo, PayPal, Zelle, Stripe (card), or cash**.

Built as a Progressive Web App (PWA), so it installs and runs full-screen on
**iPhone and Android** straight from the browser.

## Features

- **Two modes in one app** — toggle between *Rider* and *Driver* from the header.
- **Single trip** (point-to-point) **or Hire-by-time** (pick a duration, add multiple stops).
- **Find a car** — live map of nearby drivers with ETA and vehicle details.
- **Service tiers** — UCS Standard, UCS XL (extra seats), UCS Lux (premium).
- **Wide ride preferences** — quiet/chatty, music, eating & drinks, smoking, pets,
  luggage, A/C, child seat, wheelchair accessible, phone calls, and more.
- **Flexible payments** — Cash App / Venmo / PayPal / Zelle deeplinks + Stripe card + cash.
- **Driver tools** — go online, accept requests, run the trip, manage vehicles, track earnings.
- **Live status tracking** with driver card, route, and fare breakdown.

## Tech

- **Backend:** FastAPI + SQLAlchemy + SQLite (stdlib auth: PBKDF2 + HMAC tokens — no external deps).
- **Frontend:** React 19 + Vite + vite-plugin-pwa.
- Single-origin in production: FastAPI serves the built SPA and the `/api` routes together.

## Run locally

```bash
./start.sh                       # builds the frontend, serves on $APP_PORT (default 3000)
# or, for development:
uv run uvicorn backend.app:app --reload --port 3100   # API on :3100
cd frontend && npm install && npm run dev             # UI on :3000 (proxies /api -> :3100)
```

## Demo logins (seeded)

| Role   | Email                  | Password      |
|--------|------------------------|---------------|
| Rider  | `rider@ucsrides.com`   | `password123` |
| Driver | `driver@ucsrides.com`  | `password123` |

Five demo drivers are seeded online around downtown San Francisco so the map and
"find a car" flow work immediately.

## Payment handles

Business payment handles are configurable via environment variables
(`UCS_CASHAPP`, `UCS_VENMO`, `UCS_PAYPAL`, `UCS_ZELLE`) and default to UCS placeholders.
Stripe is wired as a PaymentIntent placeholder — swap in real Stripe keys for production.

> POC note: payments via Cash App/Venmo/PayPal/Zelle are settled out-of-band (the app
> generates the deeplink/handle and records the charge). Stripe is a demo placeholder.
