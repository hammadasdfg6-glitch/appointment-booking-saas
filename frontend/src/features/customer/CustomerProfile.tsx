import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User as UserIcon, Mail, Lock, Shield, KeyRound } from 'lucide-react';
import { profileSchema, ProfileFormData } from '../../lib/zod-schemas';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { getErrorMessage } from '../../api/client';

export function CustomerProfile() {
  const { user, role, refetchUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await authApi.updateProfile(data);
      await refetchUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
          Account Settings
        </h1>
        <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, email address, and security.
        </p>
      </div>

      {/* Profile Form Card */}
      <Card padding="lg">
        <Card.Header
          title="Personal Information"
          description="Update your contact information below."
        />
        <Card.Body>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              leftAddon={<UserIcon className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email Address"
              type="email"
              leftAddon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Security & Password */}
      <Card padding="lg">
        <Card.Header
          title="Security & Password"
          description="Manage your login password securely."
        />
        <Card.Body>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <h4 className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                Password Reset
              </h4>
              <p className="text-caption text-slate-500 dark:text-slate-400 max-w-md">
                Need to update your password? You can request a secure reset link sent directly to your registered email address.
              </p>
            </div>
            <Link to="/forgot-password" className="w-full sm:w-auto inline-flex shrink-0">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Reset Password
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
