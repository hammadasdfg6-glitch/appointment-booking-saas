import { apiClient } from './client';
import { Booking } from '../types/api';

export interface CreateCheckoutSessionPayload {
  serviceId: string;
  staffId: string;
  slotId: string;
  startAt: string; // "HH:mm"
  date: string;    // "YYYY-MM-DD"
}

export const checkoutApi = {
  async createCheckoutSession(payload: CreateCheckoutSessionPayload) {
    const { data } = await apiClient.post<{ success: boolean; url: string }>(
      '/checkout/session',
      payload
    );
    return data;
  },

  async confirmCheckout(sessionId: string) {
    const { data } = await apiClient.get<{
      success: boolean;
      message: string;
      booking: Booking;
    }>(`/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`);
    return data;
  },
};
