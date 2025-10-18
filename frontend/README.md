# LinkExpiry Frontend

React + TypeScript + Vite frontend for LinkExpiry.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

The app will run at `http://localhost:5173`

## Build

```bash
npm run build
```

## Features

- ✅ Landing page (fully styled with pricing)
- ✅ Login / Register (with validation)
- ✅ Protected routes
- ✅ API client with auto-refresh
- ✅ Auth store (Zustand)
- ✅ Dashboard (full API integration, CRUD operations)
- ✅ Create Link (complete form with QR code generation)
- ✅ Edit Link (update existing links)
- ✅ Link Analytics (charts, CSV export, date ranges)
- ✅ Settings (Profile, Security, Billing, Notifications)

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (state)
- TanStack Query
- Axios
