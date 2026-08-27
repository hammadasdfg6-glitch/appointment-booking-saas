import { apiClient } from './client';
import { 
  TotalStats, 
  AdvancedStats, 
  StaffPeriodStats, 
  TodayStaffStatsResponse, 
  WeeklyStaffStatsResponse, 
  MonthlyStaffStatsResponse 
} from '../types/api';

export const statsApi = {
  async getTotalStats(): Promise<TotalStats> {
    const { data } = await apiClient.get<TotalStats>('/stats');
    return data;
  },

  async getAdvancedStats(): Promise<AdvancedStats> {
    const { data } = await apiClient.get<{ success: boolean; data: AdvancedStats }>('/stats/advanced');
    return data.data;
  },

  async getTodayStaffStats(): Promise<StaffPeriodStats> {
    const { data } = await apiClient.get<TodayStaffStatsResponse>('/stats/todayStats');
    return data.todayBookingData;
  },

  async getWeeklyStaffStats(): Promise<StaffPeriodStats> {
    const { data } = await apiClient.get<WeeklyStaffStatsResponse>('/stats/weeklyStats');
    return data.weeklyStats;
  },

  async getMonthlyStaffStats(): Promise<StaffPeriodStats> {
    const { data } = await apiClient.get<MonthlyStaffStatsResponse>('/stats/monthlyStats');
    return data.monthlyStats;
  },
};

