import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, ServicePayload } from '../api/services.api';

export function useServices(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['services', page, limit],
    queryFn: () => servicesApi.getServices(page, limit),
    staleTime: 60 * 1000,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => servicesApi.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ currentName, payload }: { currentName: string; payload: ServicePayload }) =>
      servicesApi.updateService(currentName, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => servicesApi.deleteService(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
