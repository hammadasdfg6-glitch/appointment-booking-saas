# 🗓️ AppointFlow — Multi-Tenant Appointment Booking SaaS Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=flat-square&logo=react-query)](https://tanstack.com/query/latest)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-Apollo_Server_4-E10098?style=flat-square&logo=graphql)](https://graphql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Background_Jobs-red?style=flat-square)](https://bullmq.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout_%26_Webhooks-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Resend](https://img.shields.io/badge/Resend-HTTPS_Email_API-black?style=flat-square&logo=resend)](https://resend.com/)
[![Vitest](https://img.shields.io/badge/Tests-69_Passing-729B1B?style=flat-square&logo=vitest)](https://vitest.dev/)

**AppointFlow** is an enterprise-ready, multi-tenant Appointment Scheduling & Booking SaaS platform. It combines high-concurrency slot reservations with atomic Redis locks, automated BullMQ asynchronous background workers, cryptographically verified Stripe checkout, a flexible **GraphQL API** with embedded **Apollo Sandbox**, and a responsive, high-performance React 18 + TypeScript SPA with instant **1-Click Live Demo testing**.

---

## 📑 Table of Contents
1. [Key Features & Capabilities](#-key-features--capabilities)
2. [System Architecture](#-system-architecture)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Quick Start & Local Setup](#-quick-start--local-setup)
6. [Environment Variables](#-environment-variables)
7. [API Contract & Quirks Matrix (REST & GraphQL)](#-api-contract--quirks-matrix)
8. [GraphQL & Apollo Sandbox Guide](#-graphql--apollo-sandbox)
9. [Background Queues & Workers](#-background-queues--workers)
10. [Testing & Build Verification](#-testing--build-verification)
11. [Production Deployment Guide](#-production-deployment-guide)
12. [License](#-license)

---

## 🌟 Key Features & Capabilities

### 🏢 1. True Multi-Tenancy
* **Data Model Isolation**: Strict tenant segregation (`orgId`) enforced across all MongoDB models (`Org`, `User`, `Service`, `Availability`, `Booking`, `Revenue`, `Stats`).
* **Slug Routing**: Public booking flows support direct slug-based and organization-scoped identifiers (`/book?org=<slug_or_id>`).
* **Multi-Tier Plans**: Tiered subscription structures (`Free`, `Pro`, `Enterprise`) for tenant organizations.

### 🚀 2. 1-Click Interactive Live Demo
* **Zero-Setup Testing**: Dedicated live demo launcher modal directly on Landing Page and Sign-in page.
* **Instant Role Impersonation**:
  * 👑 **Business Owner**: `demo.owner@appointflow.com` $\rightarrow$ Full enterprise control & master revenue analytics.
  * 👨‍💼 **Staff Provider**: `demo.staff@appointflow.com` $\rightarrow$ Schedule view, 1-click status completion & slot generation.
  * 🙋 **Customer / Client**: `demo.customer@appointflow.com` $\rightarrow$ 5-step booking wizard with Stripe checkout.

### 💰 3. Revenue Intelligence & Filtered Analytics
* **Dynamic Breakdown Explorer**: Granular real-time revenue analytics filterable by:
  * 👨‍💼 **Staff Member** (Specific provider or all team members)
  * 💼 **Service Category** (Specific offering or all services)
  * 📅 **Calendar Date** (Today, specific dates, or date ranges)
* **Deterministic Caching**: High-performance multi-tenant Redis hashing with 10-minute TTL.

### 🔮 4. GraphQL API & Localhost Apollo Sandbox
* **Apollo Server 4 Engine**: Mounted at `http://localhost:5052/graphql` on Express 5.
* **Embedded Apollo Sandbox**: Interactive visual schema explorer, documentation browser, and query execution editor enabled exclusively for localhost / development.
* **Nested Field Resolution**: Automatically resolves `Booking.customer`, `Booking.staff`, and `Booking.service` without manual joins.
* Complete architectural guide available in [`docs/GRAPHQL_GUIDE.md`](./docs/GRAPHQL_GUIDE.md).

### ⚡ 5. Concurrency Safety & Slot Reservation Locks
* **Atomic Redis Hold Locks**: During checkout, an atomic 2-minute hold (`hold:<slotId>`) prevents double-bookings under concurrent client traffic.
* **Live UI Hold Countdown**: Interactive countdown timer badge displays remaining hold time before releasing the lock back into the pool.
* **Automatic Hold Release**: If the user cancels, abandons, or the checkout session expires, the lock is automatically lifted in Redis.

### 💳 6. Stripe Checkout & Cryptographic Webhooks
* Seamless Stripe Hosted Checkout for credit cards, Apple Pay, and Google Pay.
* Idempotent webhook verification using `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.
* Automatic booking state transition (`pending` $\rightarrow$ `confirmed`) and atomic revenue incrementing upon `checkout.session.completed`.

### 📬 7. BullMQ Asynchronous Job Queues
* **Email Queue (`email-queue`)**: Asynchronous booking confirmation emails, cancellation notices, and delayed **24-hour appointment reminders**.
* **Report Queue (`report-queue`)**: Weekly cron job computing weekly revenue and booking summaries for business owners.
* **Cache Queue (`cache-queue`)**: Nightly cron job warming the upcoming 7-day slot availability cache.
* **Staff Stats Queues (`staff-stats`, `weekly-stats`, `monthly-stats`)**: Automated rollover and calendar reset workers.

### 🎨 8. Modern Frontend Ergonomics
* **Dark / Light Theme**: Contrast-tuned design tokens with smooth transitions.
* **Form Accessibility**: Interactive password visibility toggles (`Eye` / `EyeOff`), focus rings, and inline validation with **React Hook Form + Zod**.
* **Time-of-Day Slot Bucketing**: Slots automatically bucketed into 🌅 **Morning**, ☀️ **Afternoon**, and 🌙 **Evening** tabs.
* **Mobile-First Responsive UI**: Full responsive layout with collapsible navigation and touch-optimized action buttons.

---

## 📐 System Architecture

<div align="center">
  <img src="./docs/architecture.svg" alt="AppointFlow Multi-Tenant Cloud Architecture" width="800" />
</div>

The architecture leverages a decoupled, multi-tier cloud infrastructure:
1. **Client / Presentation Layer (Vercel)**: React 18 + Vite SPA serving role-based portals (Customer, Staff, Owner) and a 5-step guided booking wizard with an inline authentication gate.
2. **API & Application Layer (Railway)**: Express 5.x REST & Apollo GraphQL API orchestrator handling JWT authentication, strict tenant isolation (`orgId`), and centralized error handling.
3. **Async Job Processing (BullMQ)**: Worker engine managing transactional email delivery (Resend HTTPS API) and automated weekly revenue/booking analytics cron jobs.
4. **Data & Cache Layer**:
   * **Redis Cloud**: Distributed lock manager ensuring atomic 2-minute slot reservations (`SET NX EX 120`), BullMQ queue states, real-time analytics hashing, and rate limiting counters.
   * **MongoDB Atlas**: Multi-tenant document database with indexed schemas for organizations, users, services, bookings, availability, and revenue metrics.
5. **External Cloud Services**: Stripe Hosted Checkout sessions with cryptographic webhook listeners and Resend for transactional email dispatch.

---

## 💻 Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework & Build | React 18.3, TypeScript 5.6, Vite 5.4 |
| Styling & Theme | Tailwind CSS 3.4, clsx, tailwind-merge |
| State & Caching | TanStack React Query v5 |
| Forms & Validation | React Hook Form 7, Zod 3.23 |
| Routing & Icons | React Router DOM 6, Lucide React |
| Charts & Feedback | Recharts 2.13, Sonner (Toasts) |
| Date Utilities | date-fns 3.6 |

### Backend
| Layer | Technology |
|---|---|
| Runtime & Framework | Node.js 18+, Express 5.x |
| GraphQL Engine | Apollo Server 4 (@apollo/server), GraphQL.js |
| Database & ODM | MongoDB Atlas, Mongoose 8.x |
| Cache & Concurrency | Redis Cloud, ioredis 5.x |
| Background Queues | BullMQ 5.x |
| Security & Auth | JSON Web Tokens (JWT), bcryptjs, Helmet, CORS, Joi |
| Payments | Stripe Node SDK 17.x |
| Mailer Transport | Resend (HTTPS API) with Nodemailer SMTP Fallback |
| Testing | Vitest, Supertest (69 tests passing across 8 suites) |

---

## 📂 Project Structure

```
.
├── src/                               # Express Backend Source
│   ├── config/                        # MongoDB, Redis, and BullMQ client connections
│   ├── controllers/                   # Auth, Availability, Bookings, Checkout, Services, Stats
│   ├── graphql/                       # Apollo Server 4 GraphQL Architecture
│   │   ├── typeDefs.js                # GraphQL SDL schema definitions
│   │   ├── resolvers.js               # Root query & nested field resolvers
│   │   ├── context.js                 # JWT cookie/header authentication context builder
│   │   └── apolloServer.js            # ApolloServer instance factory & Sandbox plugins
│   ├── middlewares/                   # JWT Auth, RBAC, Tenant isolation, Rate limiters, Error handling
│   ├── models/                        # Mongoose schemas (Org, User, Service, Booking, Revenue, Stats)
│   ├── queues/                        # BullMQ queues & worker processors (Email, Cache, Report, Stats)
│   ├── routes/                        # Express REST route definitions
│   ├── services/                      # Nodemailer SMTP transport service
│   ├── utils/                         # AppError, catchAsync, slot calculation algorithms
│   ├── validations/                   # Joi validation schemas
│   ├── app.js                         # Express application setup & middleware chain
│   └── swagger.yaml                   # OpenAPI 3.0 API specifications
│
├── frontend/                          # Vite + React 18 Frontend
│   ├── src/
│   │   ├── api/                       # Axios API client instances & endpoints
│   │   ├── components/                # Reusable UI primitives (Button, Card, Modal, Badge, DemoModal, etc.)
│   │   ├── contexts/                  # AuthContext and ThemeContext providers
│   │   ├── features/                  # Role-based feature views (auth, owner, staff, customer, wizard)
│   │   │   ├── owner/components/      # RevenueExplorer dynamic analytics widget
│   │   ├── hooks/                     # TanStack React Query custom hooks (useStats, useSlots, useAuth)
│   │   ├── lib/                       # Calendar (.ics/Google Cal) & CSV export utilities
│   │   ├── pages/                     # Route entry pages (Landing, Login, GetStarted, Success, 404)
│   │   ├── types/                     # TypeScript API & entity declarations
│   │   ├── App.tsx                    # Route definitions & layout wrappers
│   │   └── main.tsx                   # React root entry point
│   ├── package.json                   # Frontend dependencies & scripts
│   ├── tailwind.config.js             # Tailwind design token configuration
│   ├── tsconfig.json                  # TypeScript compiler options & path aliases
│   └── vite.config.ts                 # Vite server & build settings
│
├── docs/                              # Architecture Documentation & GraphQL Guides
│   └── GRAPHQL_GUIDE.md               # Extensive GraphQL & Apollo Sandbox guide
├── tests/                             # Automated Vitest integration test suite (8 test files)
├── server.js                          # Production server entry point
├── .env.example                       # Backend environment template
├── package.json                       # Backend scripts & dependencies
└── README.md                          # Main project documentation
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
* **Node.js**: `v18.0.0` or higher
* **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
* **Redis**: Local Redis instance or free [Redis Cloud](https://redis.io/cloud) instance
* **Stripe Account**: Free [Stripe Developer Account](https://stripe.com) for test API keys

---

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/hammadasdfg6-glitch/appointment-booking-saas.git
cd appointment-booking-saas

# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit your `.env` file, then start the backend server:

```bash
# Start backend in development mode (with auto-reload)
npm run dev

# Or start in production mode
npm start
```

* **Backend API**: `http://localhost:5052`
* **Swagger OpenAPI Docs**: `http://localhost:5052/api-docs`
* **Apollo GraphQL Sandbox**: `http://localhost:5052/graphql`

---

### 3. Frontend Setup
In a new terminal window:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
# Server Configuration
PORT=5052
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (MongoDB)
MONGO_URI=mongodb://localhost:27017/appointflow
# Or Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/appointflow

# Security & Tokens
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Cache & Message Broker (Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password_if_any

# Email Notification Transport (Nodemailer SMTP)
FROM=noreply@appointflow.com
PASS=your_smtp_or_gmail_app_password

# Stripe Payments & Webhooks
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (`frontend/.env`)
```env
# API Gateway URL (defaults to http://localhost:5052 if omitted)
VITE_API_URL=http://localhost:5052
```

---

## 📡 API Contract & Quirks Matrix

### Authentication & Tenant Endpoints
| Method | Endpoint | Access | Key Payload Notes |
|---|---|---|---|
| `POST` | `/auth/orgs` | Public | Body: `{ name, slug, timezone, ownerName, ownerEmail, password, plan }` |
| `POST` | `/auth/login` | Public | Body: `{ email, passwordHash }` |
| `POST` | `/auth/register` | Public | Body: `{ name, email, passwordHash, orgName }` |
| `POST` | `/auth/orgs/:orgId/staff` | Owner | Body: `{ name, email, passwordHash, role: "staff" }` |
| `POST` | `/auth/reset-password` | Public | Body: `{ email, password }` |
| `GET` | `/auth/me` | Authenticated | Returns authenticated user profile |
| `PATCH`| `/auth/me` | Authenticated | Body: `{ name, email }` |
| `GET` | `/auth/staff` | Authenticated | Returns staff members in tenant org |
| `DELETE`| `/auth/staff/:staffId` | Owner | Removes staff member and disassociates availability |
| `POST` | `/auth/logout` | Authenticated | Clears auth cookies and invalidates session |

### Services Endpoints
| Method | Endpoint | Access | Key Payload Notes |
|---|---|---|---|
| `GET` | `/service` | Authenticated | Lists all services for tenant organization |
| `POST` | `/service/create` | Owner | Body: `{ name, description, durationMinutes, price, active }` |
| `PATCH`| `/service/:name` | Owner | Body: `{ name, description, durationMinutes, price, active }` |
| `DELETE`| `/service/:name` | Owner | Deactivates service |

### Availability & Slots
| Method | Endpoint | Access | Key Payload Notes |
|---|---|---|---|
| `GET` | `/availiability/slots` | Authenticated | Query: `?staffId=&date=YYYY-MM-DD` |
| `POST`| `/availiability/` | Staff/Owner | Body: `{ weeklySchedule: [{ dayOfWeek, isWorking, startTime, endTime, breakStart, breakEnd }] }` |
| `POST`| `/availiability/generate-slots` | Staff/Owner | Body: `{ staffId, date, duration }` *(Auto-provisions working hours for any calendar date)* |
| `GET` | `/availiability/:staffId` | Authenticated | Retrieves availability rules for specified staff |
| `PATCH`| `/availiability/:staffId` | Staff/Owner | Updates availability rules for specified staff |
| `DELETE`| `/availiability/:staffId` | Staff/Owner | Deletes availability rules for specified staff |

### Checkout & Bookings
| Method | Endpoint | Access | Key Payload Notes |
|---|---|---|---|
| `POST` | `/checkout/session` | Customer/Owner | Body: `{ serviceId, staffId, slotId, startAt, date }` *(Places 2-min Redis hold)* |
| `GET`  | `/checkout/confirm` | Authenticated | Query: `?session_id=` *(Confirms Stripe transaction or $0 booking)* |
| `POST` | `/checkout/webhook` | Stripe Public | Raw body + `stripe-signature` header *(Idempotent webhook listener)* |
| `POST` | `/booking` | Customer/Owner | Body: `{ serviceId, staffId, startAt, date }` *(Direct confirmation for free services)* |
| `GET`  | `/booking` | Authenticated | Query: `?page=1&limit=10&status=&date=&staffId=` |
| `PATCH`| `/booking/:id/status` | Staff/Owner | Body: `{ status: "pending" \| "confirmed" \| "completed" \| "cancelled" }` |
| `DELETE`| `/booking/:id` | Authenticated | Cancels appointment, updates Redis metrics, and releases slot lock |

### Analytics & Stats Endpoints
| Method | Endpoint | Access | Key Payload Notes |
|---|---|---|---|
| `GET`  | `/stats` | Owner | Master organization metrics (revenue, total bookings, active services) |
| `GET`  | `/stats/advanced` | Owner | Advanced monthly revenue & booking comparative analytics |
| `GET`  | `/stats/revenue` | Owner | Filtered paid revenue breakdown. Query: `?staffId=&serviceId=&date=YYYY-MM-DD` |
| `GET`  | `/stats/todayStats` | Staff/Owner | Today's live booking metrics (`total`, `completed`, `cancelled`, `pending`) |
| `GET`  | `/stats/weeklyStats` | Staff/Owner | Current Calendar Week metrics (Sunday $\rightarrow$ Today) |
| `GET`  | `/stats/monthlyStats`| Staff/Owner | Current Calendar Month metrics (1st of month $\rightarrow$ Today) |

---

## 🔮 GraphQL & Apollo Sandbox

AppointFlow provides a full-featured GraphQL endpoint mounted at `http://localhost:5052/graphql`.

### Sample Queries (Copy & Run in Apollo Sandbox):

```graphql
# 1. Organization & Service Catalog Discovery
query GetStudioDirectory {
  org(slug: "appointflow-demo") {
    _id
    name
    slug
    plan
  }
  services(orgId: "6a91241545540a60ac3776c6") {
    _id
    name
    price
    durationMinutes
  }
  staff(orgId: "6a91241545540a60ac3776c6") {
    _id
    name
    email
    role
  }
}

# 2. Bookings Ledger with Nested Relational Resolvers
query GetBookingsWithRelations {
  bookings(orgId: "6a91241545540a60ac3776c6") {
    _id
    date
    startAt
    endAt
    status
    price
    customer { name email }
    staff { name email }
    service { name price durationMinutes }
  }
}
```

For complete architectural specifications, see [`docs/GRAPHQL_GUIDE.md`](./docs/GRAPHQL_GUIDE.md).

---

## 📬 Background Queues & Workers

BullMQ workers run concurrently with the Express server for reliable, fault-tolerant background execution:

```
[BullMQ] Initializing queues...
[BullMQ] ✓ Email Queue Worker online
[BullMQ] ✓ Report Queue Worker online (Cron: 0 9 * * 1)
[BullMQ] ✓ Cache Queue Worker online (Cron: 0 0 * * *)
[BullMQ] ✓ Staff Stats Worker online (Cron: 0 0 * * *)
[BullMQ] ✓ Weekly Stats Worker online (Cron: 0 11 * * 0)
[BullMQ] ✓ Monthly Stats Worker online (Cron: 30 23 * * *)
```

* **Email Worker (`email-queue`)**: Renders HTML emails for confirmations, cancellations, and delayed 24-hour appointment reminders.
* **Weekly Report Worker (`report-queue`)**: Cron triggers every Monday at 09:00 AM UTC (`0 9 * * 1`), calculating weekly gross revenue per org and dispatching email digests.
* **Cache Warming Worker (`cache-queue`)**: Nightly cron (`0 0 * * *`) pre-calculates and warms availability matrices for the upcoming 7 days.
* **Staff Daily Stats Rollover (`staff-stats`)**: Nightly cron (`0 0 * * *`) rolls over completed daily stats into weekly/monthly Redis accumulators.
* **Weekly Stats Reset (`weekly-stats`)**: Triggers every Sunday (`0 11 * * 0`) to cleanly reset calendar weekly counters for the new week.
* **Monthly Stats Reset (`monthly-stats`)**: Triggers on the last day of each month (`30 23 * * *`) to reset calendar monthly metrics.

---

## 🧪 Testing & Build Verification

### Backend Automated Test Suite
Run the 69-test integration and unit test suite powered by [Vitest](https://vitest.dev/):

```bash
npm test
```

```text
 ✓ tests/staffStatsQueue.test.js (5 tests)
 ✓ tests/bookings.controller.test.js (8 tests)
 ✓ tests/stats.controller.test.js (13 tests)
 ✓ tests/auth.controller.test.js (16 tests)
 ✓ tests/avail.controller.test.js (12 tests)
 ✓ tests/checkout.controller.test.js (2 tests)
 ✓ tests/graphql.test.js (3 tests)
 ✓ tests/service.controller.test.js (10 tests)

 Test Files  8 passed (8)
      Tests  69 passed (69)
```

### Frontend TypeScript & Production Build
Validate TypeScript types and build minified production bundles:

```bash
cd frontend
npm run build
```

```text
vite v5.4.21 building for production...
✓ 2843 modules transformed.
dist/index.html                     0.96 kB │ gzip:   0.53 kB
dist/assets/index-DFmrYIkW.css     49.20 kB │ gzip:   8.30 kB
dist/assets/index-BxG0isxw.js   1,062.41 kB │ gzip: 296.71 kB
✓ built in 11.86s
```

---

## 🌐 Production Deployment Guide

### 1. Deploy Backend (Railway / Render / Fly.io / AWS ECS)
1. Link your GitHub repository to your cloud hosting platform.
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `npm start`
4. Set environment variables from `.env.example` using production MongoDB Atlas and Redis Cloud credentials.
5. In Stripe Dashboard, configure the webhook endpoint URL to:
   `https://api.yourdomain.com/checkout/webhook`
   and copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

### 2. Deploy Frontend (Vercel / Netlify / Cloudflare Pages)
1. Import the repository and set the **Root Directory** to `frontend`.
2. Set **Build Command**: `npm run build`
3. Set **Output Directory**: `dist`
4. Configure Single-Page Application (SPA) rewrite rule (e.g. `/*` $\rightarrow$ `/index.html`).
5. Set environment variable:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
6. Deploy!

---

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
