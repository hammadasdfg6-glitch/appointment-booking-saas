import { apiClient } from './client';
import { User, UserRole } from '../types/api';

export interface RegisterOrgPayload {
  name: string;
  slug: string;
  timezone?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  ownerName: string;
  ownerEmail: string;
  password: string; // Quirk: exactly 'password' for org registration
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  passwordHash: string; // Quirk: exactly 'passwordHash' for customer registration
  orgName: string;
  role?: 'customer';
}

export interface LoginPayload {
  email: string;
  passwordHash: string; // Quirk: exactly 'passwordHash' for login
}

export interface AddStaffPayload {
  name: string;
  email: string;
  passwordHash: string; // Quirk: exactly 'passwordHash' for add staff
  role: 'staff' | 'owner';
}

export interface ResetPasswordPayload {
  token: string;
  password: string; // Quirk: exactly 'password' for reset password
}

export const authApi = {
  async registerOrg(payload: RegisterOrgPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/orgs',
      payload
    );
    return data;
  },

  async registerCustomer(payload: RegisterCustomerPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string; role: UserRole }>(
      '/auth/register',
      payload
    );
    return data;
  },

  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string; role: UserRole }>(
      '/auth/login',
      payload
    );
    return data;
  },

  async logout() {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
    return data;
  },

  async getMe() {
    const { data } = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return data.user;
  },

  async updateProfile(payload: { name?: string; email?: string }) {
    const { data } = await apiClient.patch<{ success: boolean; message: string; user: User }>(
      '/auth/me',
      payload
    );
    return data;
  },

  async getStaff() {
    const { data } = await apiClient.get<{ success: boolean; staff: User[] }>('/auth/staff');
    return data.staff;
  },

  async addStaff(orgId: string, payload: AddStaffPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      `/auth/orgs/${orgId}/staff`,
      payload
    );
    return data;
  },

  async deleteStaff(staffId: string) {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/auth/staff/${staffId}`
    );
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/forgot-password',
      { email }
    );
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/reset-password',
      payload
    );
    return data;
  },
};
