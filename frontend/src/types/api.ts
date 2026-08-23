export type UserRole = 'owner' | 'staff' | 'customer';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface User {
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  orgId?: string;
  createdAt?: string;
}

export interface Org {
  _id?: string;
  name: string;
  slug: string;
  timezone?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
}

export interface Service {
  _id?: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
  orgId?: string;
  createdAt?: string;
}

export interface SlotItem {
  _id: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:30"
  status: 'available' | 'booked' | 'locked';
}

export interface AvailabilityRecord {
  _id?: string;
  orgId?: string;
  staffId?: string;
  dayOfWeek: number; // 0=Sunday...6=Saturday
  startTime: string;
  endTime: string;
}

export interface Booking {
  _id: string;
  orgId: string;
  staffId: {
    _id: string;
    name: string;
  } | string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  } | string;
  serviceId: {
    _id: string;
    name: string;
    price: number;
  } | string;
  slotId: string;
  status: BookingStatus;
  date: string; // "YYYY-MM-DD"
  price: number;
  startAt: string;
  endAt: string;
  stripeSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TotalStats {
  totalAvailabilities: number;
  totalBookings: number;
  totalCustomers: number;
  totalServices: number;
  totalSlots: number;
  totalStaff: number;
}

export interface AdvancedStats {
  today: {
    bookings: number;
    revenue: number;
  };
  tomorrow: {
    bookings: number;
  };
  comparisons: {
    bookingTodayVsTomorrow: string;
    revenueThisWeekVsLastWeek: string;
    revenueThisMonthVsLastMonth: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServicesResponse extends PaginatedResponse<Service> {
  services: Service[];
}

export interface BookingsResponse extends PaginatedResponse<Booking> {
  bookings: Booking[];
}

export interface SlotsResponse {
  success: boolean;
  message?: string;
  total: number;
  slots: SlotItem[];
}
