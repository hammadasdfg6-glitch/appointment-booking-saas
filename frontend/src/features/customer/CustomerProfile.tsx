import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, Building } from 'lucide-react';
import {
  profileSchema,
  ProfileFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from '../../lib/zod-schemas';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../api/client';

export function CustomerProfile() {
  const { user, role, refetchUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Show/Hide password toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Information Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Change Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      await authApi.updateProfile(data);
      await refetchUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    setIsUpdatingPassword(true);
    try {
      await authApi.updateProfile({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Account Settings
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal details, email address, and security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role && (
            <Badge variant={role as any}>
              {role.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Form Card */}
      <Card padding="lg">
        <Card.Header
          title="Personal Information"
          description="Update your display name and contact email address."
        />
        <Card.Body>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              leftAddon={<UserIcon className="w-4 h-4" />}
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />

            <Input
              label="Email Address"
              type="email"
              leftAddon={<Mail className="w-4 h-4" />}
              error={profileErrors.email?.message}
              {...registerProfile('email')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdatingProfile}
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Change Password Card */}
      <Card padding="lg">
        <Card.Header
          title="Change Password"
          description="Enter your current password and choose a new secure password."
        />
        <Card.Body>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type={showOldPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftAddon={<Lock className="w-4 h-4" />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={passwordErrors.oldPassword?.message}
              {...registerPassword('oldPassword')}
            />

            <Input
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              helperText="Minimum 4 characters"
              leftAddon={<KeyRound className="w-4 h-4" />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftAddon={<KeyRound className="w-4 h-4" />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isUpdatingPassword}
                className="w-full sm:w-auto"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Forgot Password Link Card */}
      <Card padding="lg">
        <Card.Header
          title="Forgot Password?"
          description="If you don't know your current password, you can request an email reset link."
        />
        <Card.Body>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <h4 className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                Send Reset Link
              </h4>
              <p className="text-caption text-slate-500 dark:text-slate-400 max-w-md">
                We'll email you a secure link to reset your password without needing your current one.
              </p>
            </div>
            <Link to="/forgot-password" className="w-full sm:w-auto inline-flex shrink-0">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Mail className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Email Reset Link
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
