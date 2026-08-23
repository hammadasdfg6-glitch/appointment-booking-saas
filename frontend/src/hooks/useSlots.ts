import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  availabilityApi,
  AddAvailabilityPayload,
  GenerateSlotsPayload,
} from '../api/availability.api';

export function useSlots(staffId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ['slots', staffId, date],
    queryFn: () => {
      if (!staffId || !date) return { success: true, total: 0, slots: [] };
      return availabilityApi.getSlots(staffId, date);
    },
    enabled: !!staffId && !!date,
    staleTime: 30 * 1000,
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateSlotsPayload) => availabilityApi.generateSlots(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['slots', variables.staffId, variables.date] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useAddAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddAvailabilityPayload) => availabilityApi.addAvailability(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: string) => availabilityApi.deleteAvailability(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
