import { apiClient } from './client';
import { Service, ServicesResponse } from '../types/api';

export interface ServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
}

export const servicesApi = {
  async getServices(page = 1, limit = 50): Promise<ServicesResponse> {
    try {
      const { data } = await apiClient.get<ServicesResponse>(`/service?page=${page}&limit=${limit}`);
      return data;
    } catch (error: unknown) {
      // Backend returns 404 "No Services Found!" as an expected empty state
      const err = error as { status?: number; response?: { status?: number } };
      if (err.status === 404 || err.response?.status === 404) {
        return {
          success: true,
          page,
          limit,
          total: 0,
          totalPages: 0,
          services: [],
        };
      }
      throw error;
    }
  },

  async createService(payload: ServicePayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/service/create',
      payload
    );
    return data;
  },

  async updateService(currentName: string, payload: ServicePayload) {
    // Note: Backend requires full payload on PUT /service/:name
    const { data } = await apiClient.put<{ success: boolean; message: string }>(
      `/service/${encodeURIComponent(currentName)}`,
      payload
    );
    return data;
  },

  async deleteService(name: string) {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/service/${encodeURIComponent(name)}`
    );
    return data;
  },
};
