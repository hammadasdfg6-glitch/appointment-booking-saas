import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, AddStaffPayload } from '../api/auth.api';

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => authApi.getStaff(),
    staleTime: 60 * 1000,
  });
}

export function useAddStaff(orgId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddStaffPayload) => authApi.addStaff(orgId || 'org', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => authApi.deleteStaff(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
