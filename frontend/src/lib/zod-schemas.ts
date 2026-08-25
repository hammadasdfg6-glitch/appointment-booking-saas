import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerOrgSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-zA-Z0-9-]+$/, 'Slug can only contain letters, numbers, and hyphens'),
  timezone: z.string().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

export type RegisterOrgFormData = z.infer<typeof registerOrgSchema>;

export const registerCustomerSchema = z.object({
  name: z.string().min(1, 'Your name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  orgName: z.string().min(1, 'Business name is required'),
});

export type RegisterCustomerFormData = z.infer<typeof registerCustomerSchema>;

export const addStaffSchema = z.object({
  name: z.string().min(1, 'Staff name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['staff', 'owner']).default('staff'),
});

export type AddStaffFormData = z.infer<typeof addStaffSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string().min(4, 'Confirm password must be at least 4 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  durationMinutes: z.coerce
    .number()
    .int('Must be an integer')
    .min(1, 'Minimum duration is 1 minute')
    .max(60, 'Maximum duration is 60 minutes'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:mm (24-hour)'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:mm (24-hour)'),
});

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(4, 'New password must be at least 4 characters'),
    confirmPassword: z.string().min(4, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
