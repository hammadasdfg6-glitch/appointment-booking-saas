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
