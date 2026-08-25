# 🎨 AppointFlow Frontend Client

Modern, highly responsive Single-Page Application (SPA) built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🛠️ Architecture & Tech Stack

* **Core**: React 18.3 + TypeScript 5.6
* **Build Tooling**: Vite 5.4
* **Routing**: React Router DOM v6 (Role-protected route guards)
* **Styling & Tokens**: Tailwind CSS 3.4 + custom design tokens (light/dark mode)
* **Server State & Caching**: TanStack React Query v5
* **Form State & Validation**: React Hook Form + Zod resolvers
* **Icons & Feedback**: Lucide React + Sonner (Toasts)
* **Charts**: Recharts 2.13
* **Date Manipulation**: date-fns 3.6

---

## 📂 Directory Structure

```
frontend/src/
├── api/                      # Axios HTTP clients & endpoint contracts
│   ├── client.ts             # Base Axios instance with withCredentials: true
│   ├── auth.api.ts           # Login, register, org onboarding, staff CRUD
│   ├── services.api.ts       # Service CRUD
│   ├── availability.api.ts   # Weekly hours & slot generation
│   ├── bookings.api.ts       # Booking lifecycle & cancellation
│   ├── checkout.api.ts       # Stripe sessions & payment verification
│   └── stats.api.ts          # Revenue & analytics aggregation
│
├── components/               # Design system & reusable UI primitives
│   ├── layout/               # AppLayout, Sidebar, Navbar, MobileNav
│   └── ui/                   # Button, Card, Input, Select, Modal, Badge, Stepper, etc.
│
├── contexts/                 # Context Providers
│   ├── AuthContext.tsx       # Auth state, login/logout, active role
│   └── ThemeContext.tsx      # Dark / Light mode toggle & persistence
│
├── features/                 # Modular feature modules
│   ├── auth/                 # LoginPage, GetStartedPage, ResetPasswordPage
│   ├── booking-wizard/       # 5-step interactive customer booking wizard
│   ├── customer/             # Customer appointments dashboard & profile
│   ├── owner/                # Overview, Services CRUD, Team members, Bookings master
│   └── staff/                # Schedule view, Today's agenda, Weekly hours, Slot generator
│
├── hooks/                    # Custom TanStack React Query hooks
├── lib/                      # Utilities (calendar-utils.ts, csv-utils.ts, utils.ts, zod-schemas.ts)
├── pages/                    # Route entry points (LandingPage, BookingSuccessPage, NotFoundPage)
├── types/                    # TypeScript interfaces & API payload schemas
├── App.tsx                   # React Router route registry
└── main.tsx                  # DOM root mounting & TanStack QueryClient setup
```

---

## 🔑 Key Features & User Experiences

### 1. 5-Step Customer Booking Wizard (`/book`)
* **Step 1 — Service**: Search services by name and filter by duration (`≤ 30 min`, `30–60 min`).
* **Step 2 — Provider**: Select qualified staff members.
* **Step 3 — Date**: 60-day interactive date calendar.
* **Step 4 — Time Slot**: Bucketed time-of-day slots (🌅 **Morning**, ☀️ **Afternoon**, 🌙 **Evening**).
* **Step 5 — Review & Checkout**:
  * Live **2-Minute Hold Countdown Timer** reflecting atomic Redis slot holds.
  * Complimentary ($0) instant confirmation or secure Stripe Checkout redirect.

### 2. Post-Booking Calendar Sync (`/booking-success`)
* One-click **"Google Cal"** button pre-fills appointment details.
* One-click **"Apple / Outlook"** button generates and downloads a native `.ics` file.

### 3. Business Owner Suite (`/dashboard/owner`)
* **Shareable Booking Link Card**: One-click public booking URL copy with toast notification.
* **Analytics**: Revenue and booking trends with Recharts area visualizations.
* **Bookings Master Ledger**: Filter by status pills (`Confirmed`, `Pending`, `Completed`, `Cancelled`) and **Export to CSV**.
* **Team & Services CRUD**: Onboard staff, configure pricing, durations, and visibility.

### 4. Staff Provider Dashboard (`/dashboard/staff`)
* **"Today's Agenda"**: Priority timeline highlighting today's appointments with 1-click status completion.
* **Weekly Hours**: Configure working hours and breaks per weekday.
* **Slot Matrix Generator**: Batch generate available appointment slots across custom date ranges.

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:5052
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```
Build output is generated in the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```
