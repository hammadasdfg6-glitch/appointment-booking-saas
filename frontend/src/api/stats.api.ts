import { apiClient } from './client';
import { TotalStats, AdvancedStats } from '../types/api';

export const statsApi = {
  async getTotalStats(): Promise<TotalStats> {
    const { data } = await apiClient.get<TotalStats>('/stats');
    return data;
  },

  async getAdvancedStats(): Promise<AdvancedStats> {
    const { data } = await apiClient.get<{ success: boolean; data: AdvancedStats }>('/stats/advanced');
    return data.data;
  },
};
