import { apiClient } from './client';
import { AvailabilityRecord, SlotsResponse } from '../types/api';

export interface AddAvailabilityPayload {
  dayOfWeek: number; // 0=Sunday...6=Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface GenerateSlotsPayload {
  staffId?: string;
  date: string; // "YYYY-MM-DD"
  duration?: number;
}

export const availabilityApi = {
  async addAvailability(payload: AddAvailabilityPayload) {
    // Note the backend endpoint spelling: /availiability/
    const { data } = await apiClient.post<{ success: boolean; message: string; data: AvailabilityRecord }>(
      '/availiability/',
      payload
    );
    return data;
  },

  async getAvailability(staffId: string) {
    try {
      const { data } = await apiClient.get<{ success: boolean; availiability: AvailabilityRecord }>(
        `/availiability/${staffId}`
      );
      return data.availiability;
    } catch (error: unknown) {
      const err = error as { status?: number; response?: { status?: number } };
      if (err.status === 404 || err.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async deleteAvailability(staffId: string) {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/availiability/${staffId}`
    );
    return data;
  },

  async generateSlots(payload: GenerateSlotsPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string; slots: SlotsResponse['slots'] }>(
      '/availiability/generate-slots',
      payload
    );
    return data;
  },

  async getSlots(staffId: string, date: string): Promise<SlotsResponse> {
    try {
      const { data } = await apiClient.get<SlotsResponse>(
        `/availiability/slots?staffId=${staffId}&date=${date}`
      );
      return data;
    } catch (error: unknown) {
      // 404 "No Slots Available" is an expected response for days with no slots
      const err = error as { status?: number; response?: { status?: number } };
      if (err.status === 404 || err.response?.status === 404) {
        return {
          success: true,
          total: 0,
          slots: [],
        };
      }
      throw error;
    }
  },
};
