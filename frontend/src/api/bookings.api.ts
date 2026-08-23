import { apiClient } from './client';
import { Booking, BookingsResponse, BookingStatus } from '../types/api';

export interface CreateBookingPayload {
  serviceId: string;
  staffId: string;
  startAt: string; // "HH:mm" matching slot.startTime
  date: string;    // "YYYY-MM-DD"
}

export interface GetBookingsParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  date?: string;
  staffId?: string;
  customerId?: string;
}

export const bookingsApi = {
  async createBooking(payload: CreateBookingPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string; booking: Booking }>(
      '/booking',
      payload
    );
    return data;
  },

  async getBookings(params: GetBookingsParams = {}): Promise<BookingsResponse> {
    const { page = 1, limit = 10, status, date, staffId, customerId } = params;
    const query = new URLSearchParams();
    query.append('page', page.toString());
    query.append('limit', limit.toString());
    if (status) query.append('status', status);
    if (date) query.append('date', date);
    if (staffId) query.append('staffId', staffId);
    if (customerId) query.append('customerId', customerId);

    try {
      const { data } = await apiClient.get<BookingsResponse>(`/booking?${query.toString()}`);
      return data;
    } catch (error: unknown) {
      // 404 "No Bookings Found" is an expected empty state
      const err = error as { status?: number; response?: { status?: number } };
      if (err.status === 404 || err.response?.status === 404) {
        return {
          success: true,
          page,
          limit,
          total: 0,
          totalPages: 0,
          bookings: [],
        };
      }
      throw error;
    }
  },

  async cancelBooking(bookingId: string) {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/booking/${bookingId}`
    );
    return data;
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const { data } = await apiClient.patch<{ success: boolean; message: string }>(
      `/booking/${bookingId}/status`,
      { status }
    );
    return data;
  },
};
