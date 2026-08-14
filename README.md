# 🗓️ AppointFlow — Multi-Tenant Appointment Booking SaaS

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Background_Jobs-red?style=flat-square)](https://bullmq.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout_%26_Webhooks-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Vitest](https://img.shields.io/badge/Tests-44_Passing-729B1B?style=flat-square&logo=vitest)](https://vitest.dev/)

A modern, production-ready, full-stack **Multi-Tenant Appointment Scheduling & Booking SaaS Platform**. Built with high performance, concurrency safety, and automated background job processing in mind.

---

## 🌟 Highlights & Features

### 🏢 Multi-Tenant Architecture
- Complete organization isolation across all data models (`Org`, `User`, `Service`, `Availability`, `Booking`, `Revenue`, `Stats`).
- Custom organization slugs and sub-paths for dedicated customer booking portals.

### 👥 Role-Based Access Control (RBAC)
- **👑 Organization Owner (Admin)**: Full control over team members, service offerings, business hours, real-time revenue analytics, and weekly automated reports.
- **👨‍💼 Staff Members**: Manage personal schedules, view upcoming bookings, and set custom working windows per day of the week.
- **🙋 Customers**: Discover services, view real-time available time slots, hold and lock slots during checkout, and manage active appointments.

### ⚡ Concurrency & Slot Hold Locking (Zero Double-Bookings)
- **Redis Hold Locks**: When a customer enters checkout, a 2-minute temporary hold (`hold:<slotId>`) is placed in Redis to prevent simultaneous bookings.
- **Automatic Hold Release**: If checkout expires or fails, the hold is instantly lifted for other customers.

### 💳 Stripe Checkout & Cryptographic Webhooks
- Seamless Stripe Checkout Sessions supporting credit cards and digital wallets.
- Idempotent **Webhook Verification** with cryptographic signatures (`stripe.webhooks.constructEvent`) to automatically generate confirmed bookings and track real-time revenue upon payment completion.

### 📬 BullMQ Background Workers
- **Email Queue (`email-queue`)**: Asynchronous booking confirmations, cancellations, and scheduled **24-hour appointment reminders**.
- **Report Queue (`report-queue`)**: Automated weekly cron job computing booking volume and revenue metrics for organization owners.
- **Cache Warming Queue (`cache-queue`)**: Nightly cron job pre-generating upcoming 7-day slot availability matrices in MongoDB.

### 🛡️ Production Security & Performance
- **HttpOnly JWT Authentication**: Short-lived access tokens (15m) + secure Refresh Tokens (3h) backed by Redis session management.
- **Rate Limiting**: Multi-tiered Redis rate limiters protecting authentication endpoints and API routes from DDoS and brute-force attacks.
- **Input Validation**: Strict schema verification with **Joi** on all mutation endpoints.
- **Interactive Swagger Docs**: Fully interactive API explorer hosted at `/api-docs`.

---

## 📐 System Architecture

```
                      ┌────────────────────────────────────────┐
                      │          Next.js Frontend              │
                      │  (Customer, Staff & Admin Dashboards)  │
                      └──────────────────┬─────────────────────┘
                                         │  /api/* Proxy Rewrite
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          Express Backend API           │
                      │   (Auth, RBAC, Tenancy, Validations)   │
                      └──────┬───────────┬───────────┬─────────┘
                             │           │           │
           ┌─────────────────┴─┐   ┌─────┴───────┐   └─────────────────┐
           ▼                   ▼   ▼             ▼                     ▼
┌────────────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────┐
│   MongoDB Atlas    │   │  Redis Cloud  │   │    BullMQ     │   │  Stripe   │
│ (Persistent Data)  │   │ (Locks/Cache) │   │ (Email/Cron)  │   │ (Payments)│
└────────────────────┘   └───────────────┘   └───────────────┘   └───────────┘
```

---

## 📂 Project Structure

```
├── src/                         # Express Backend Source
│   ├── config/                  # MongoDB & Redis client configurations
│   ├── controllers/             # Auth, Avail, Bookings, Checkout, Service, Stats
│   ├── middlewares/             # JWT Authenticator, RBAC, RateLimiter, Tenant, ErrorHandler
│   ├── models/                  # Mongoose schemas (Org, User, Service, Booking, Revenue, etc.)
│   ├── queues/                  # BullMQ queues & workers (Email, Cache, Report)
│   ├── routes/                  # Express REST route definitions
│   ├── services/                # Nodemailer email transport service
│   ├── utils/                   # AppError, catchAsync, time calculation utilities
│   ├── validations/             # Joi validation schemas
│   ├── app.js                   # Express application setup, security, & middlewares
│   └── swagger.yaml             # OpenAPI 3.0 API specifications
│
├── frontend/                    # Next.js 16 (App Router) Frontend
│   ├── public/                  # Static assets & SVGs
│   ├── src/
│   │   ├── app/                 # App router pages & layouts
│   │   │   ├── book/            # Customer public booking flow
│   │   │   ├── booking-success/ # Payment confirmation & return page
│   │   │   ├── dashboard/       # Protected Dashboards (admin, staff, customer)
│   │   │   ├── login/           # Authentication portal
│   │   │   └── register/        # Organization onboarding
│   │   ├── components/          # Reusable UI components & layouts
│   │   └── utils/               # Fetch API wrapper with error sanitization
│   ├── middleware.js            # Route protection auth guard
│   ├── next.config.mjs          # API proxy rewrites
│   └── vercel.json              # Vercel deployment configuration
│
├── tests/                       # Automated Vitest test suite (44 tests)
├── server.js                    # Production HTTP server entry point
├── .env.example                 # Backend environment variable template
└── package.json                 # Backend scripts & dependencies
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Redis**: Local instance or free [Redis Cloud](https://redis.io/cloud) instance
- **Stripe Account**: Free [Stripe](https://stripe.com) account for API keys

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/hammadasdfg6-glitch/appointment-booking-saas.git
cd appointment-booking-saas

# Install backend dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5052
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/saas
JWT_SECRET=your_secret_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
FROM=your_email@gmail.com
PASS=your_gmail_app_password
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Start the backend:
```bash
# Start development server with auto-reload
npm run dev

# Or run tests
npm test
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure local environment
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
BACKEND_URL=http://localhost:5052
```

Start the frontend:
```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser!

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `POST` | `/auth/orgs` | Register organization & owner | Public |
| `POST` | `/auth/login` | User login (returns JWT cookies) | Public |
| `POST` | `/auth/refresh` | Refresh access token | Public |
| `GET` | `/auth/me` | Fetch authenticated profile | Customer / Staff / Owner |
| `GET` | `/service` | List organization services | Authenticated |
| `POST` | `/service/create` | Create a new service offering | Owner |
| `GET` | `/availiability/slots` | Fetch real-time available slots | Authenticated |
| `POST` | `/availiability/generate-slots` | Generate slot matrix for staff | Staff / Owner |
| `POST` | `/checkout/session` | Create Stripe checkout session & lock slot | Customer / Owner |
| `GET` | `/checkout/confirm` | Confirm booking after payment | Authenticated |
| `POST` | `/checkout/webhook` | Stripe cryptographic webhook listener | Stripe Public |
| `GET` | `/booking` | List filtered bookings | Authenticated |
| `DELETE`| `/booking/:id` | Cancel an appointment | Customer / Staff / Owner |
| `GET` | `/stats` | Real-time organization stats | Owner |
| `GET` | `/stats/advanced` | Revenue & booking analytics | Owner |

> 📖 **Interactive Documentation**: Explore and execute requests live at `http://localhost:5052/api-docs`.

---

## 🌐 Production Deployment Guide

### Deploying the Backend (e.g. Render / Railway / Fly.io)
1. Create a new **Web Service** and connect this GitHub repository.
2. Set **Root Directory** to `.` (root).
3. Set **Build Command**: `npm install` and **Start Command**: `npm start`.
4. Add all environment variables from `.env.example` (using your MongoDB Atlas and Redis Cloud URLs).
5. Copy your assigned public URL (e.g. `https://api.yourdomain.com`).

### Deploying the Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add the environment variable:
   ```env
   BACKEND_URL=https://api.yourdomain.com
   ```
4. Click **Deploy**.

---

## 🧪 Testing

The platform includes a comprehensive test suite powered by [Vitest](https://vitest.dev/):

```bash
npm test
```

```text
✓ tests/auth.controller.test.js (10 tests)
✓ tests/stats.controller.test.js (3 tests)
✓ tests/bookings.controller.test.js (7 tests)
✓ tests/avail.controller.test.js (12 tests)
✓ tests/checkout.controller.test.js (2 tests)
✓ tests/service.controller.test.js (10 tests)

Test Files  6 passed (6)
     Tests  44 passed (44)
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
