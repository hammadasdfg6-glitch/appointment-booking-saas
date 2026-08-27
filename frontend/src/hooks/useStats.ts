import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/stats.api';

export function useTotalStats() {
  return useQuery({
    queryKey: ['stats', 'total'],
    queryFn: () => statsApi.getTotalStats(),
    staleTime: 60 * 1000,
  });
}

export function useAdvancedStats() {
  return useQuery({
    queryKey: ['stats', 'advanced'],
    queryFn: () => statsApi.getAdvancedStats(),
    staleTime: 60 * 1000,
  });
}

export function useTodayStaffStats() {
  return useQuery({
    queryKey: ['stats', 'staff', 'today'],
    queryFn: () => statsApi.getTodayStaffStats(),
    staleTime: 30 * 1000,
  });
}

export function useWeeklyStaffStats() {
  return useQuery({
    queryKey: ['stats', 'staff', 'weekly'],
    queryFn: () => statsApi.getWeeklyStaffStats(),
    staleTime: 60 * 1000,
  });
}

export function useMonthlyStaffStats() {
  return useQuery({
    queryKey: ['stats', 'staff', 'monthly'],
    queryFn: () => statsApi.getMonthlyStaffStats(),
    staleTime: 60 * 1000,
  });
}

