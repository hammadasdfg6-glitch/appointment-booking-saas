import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layout & Wrappers
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { BookingCancelledPage } from './pages/BookingCancelledPage';

// Auth Pages
import { LoginPage } from './features/auth/LoginPage';
import { GetStartedPage } from './features/auth/GetStartedPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';

// Core Booking Wizard
import { BookingWizardPage } from './features/booking-wizard/BookingWizardPage';

// Customer Pages
import { CustomerDashboard } from './features/customer/CustomerDashboard';
import { CustomerProfile } from './features/customer/CustomerProfile';

// Staff Pages
import { StaffDashboard } from './features/staff/StaffDashboard';
import { StaffAvailability } from './features/staff/StaffAvailability';
import { StaffGenerateSlots } from './features/staff/StaffGenerateSlots';

// Owner Pages
import { OwnerOverview } from './features/owner/OwnerOverview';
import { OwnerServices } from './features/owner/OwnerServices';
import { OwnerTeam } from './features/owner/OwnerTeam';
import { OwnerBookings } from './features/owner/OwnerBookings';

export const router = createBrowserRouter([
  // Public Marketing & Auth
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/get-started',
    element: <GetStartedPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />,
  },

  // Booking Flow & Outcomes
  {
    path: '/book',
    element: (
      <ProtectedRoute roles={['customer', 'owner', 'staff']}>
        <BookingWizardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/booking-success',
    element: <BookingSuccessPage />,
  },
  {
    path: '/booking-cancelled',
    element: <BookingCancelledPage />,
  },

  // Customer Dashboard
  {
    path: '/dashboard/customer',
    element: (
      <ProtectedRoute roles={['customer']}>
        <AppShell title="Customer Portal" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <CustomerDashboard />,
      },
      {
        path: 'profile',
        element: <CustomerProfile />,
      },
    ],
  },

  // Staff Dashboard
  {
    path: '/dashboard/staff',
    element: (
      <ProtectedRoute roles={['staff']}>
        <AppShell title="Staff Dashboard" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StaffDashboard />,
      },
      {
        path: 'availability',
        element: <StaffAvailability />,
      },
      {
        path: 'slots',
        element: <StaffGenerateSlots />,
      },
      {
        path: 'profile',
        element: <CustomerProfile />,
      },
    ],
  },

  // Owner Dashboard
  {
    path: '/dashboard/owner',
    element: (
      <ProtectedRoute roles={['owner']}>
        <AppShell title="Owner Dashboard" />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OwnerOverview />,
      },
      {
        path: 'services',
        element: <OwnerServices />,
      },
      {
        path: 'team',
        element: <OwnerTeam />,
      },
      {
        path: 'bookings',
        element: <OwnerBookings />,
      },
      {
        path: 'profile',
        element: <CustomerProfile />,
      },
    ],
  },

  // Fallback 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
