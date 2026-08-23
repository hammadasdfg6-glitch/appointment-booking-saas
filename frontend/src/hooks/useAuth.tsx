import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, LoginPayload, RegisterOrgPayload, RegisterCustomerPayload } from '../api/auth.api';
import { User, UserRole } from '../types/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  login: (payload: LoginPayload) => Promise<{ role: UserRole }>;
  registerOrg: (payload: RegisterOrgPayload) => Promise<{ role: UserRole }>;
  registerCustomer: (payload: RegisterCustomerPayload) => Promise<{ role: UserRole }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const currentUser = await authApi.getMe();
        return currentUser;
      } catch (err: unknown) {
        // A 401 response means the user is not authenticated
        const status = (err as { status?: number; response?: { status?: number } })?.status ||
                       (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          return null;
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      return data;
    },
  });

  const registerOrgMutation = useMutation({
    mutationFn: (payload: RegisterOrgPayload) => authApi.registerOrg(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerCustomerMutation = useMutation({
    mutationFn: (payload: RegisterCustomerPayload) => authApi.registerCustomer(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      return data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await loginMutation.mutateAsync(payload);
      return { role: res.role };
    },
    [loginMutation]
  );

  const registerOrg = useCallback(
    async (payload: RegisterOrgPayload) => {
      await registerOrgMutation.mutateAsync(payload);
      return { role: 'owner' as UserRole };
    },
    [registerOrgMutation]
  );

  const registerCustomer = useCallback(
    async (payload: RegisterCustomerPayload) => {
      const res = await registerCustomerMutation.mutateAsync(payload);
      return { role: (res.role || 'customer') as UserRole };
    },
    [registerCustomerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      queryClient.clear();
    }
  }, [logoutMutation, queryClient]);

  const value: AuthContextType = {
    user: user ?? null,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    isLoading,
    isError,
    login,
    registerOrg,
    registerCustomer,
    logout,
    refetchUser: refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
