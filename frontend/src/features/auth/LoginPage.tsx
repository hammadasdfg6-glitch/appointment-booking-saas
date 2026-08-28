import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { loginSchema, LoginFormData } from '../../lib/zod-schemas';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getErrorMessage } from '../../api/client';
import { DemoModal } from '../../components/DemoModal';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Backend quirk: field name in body is literally 'passwordHash'
      const { role } = await login({
        email: data.email,
        passwordHash: data.password,
      });

      toast.success('Welcome back!');

      if (next) {
        navigate(next, { replace: true });
      } else {
        const dashboardMap: Record<string, string> = {
          owner: '/dashboard/owner',
          staff: '/dashboard/staff',
          customer: '/dashboard/customer',
        };
        navigate(dashboardMap[role] || '/', { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white font-bold shadow-sm">
            A
          </div>
          <span className="text-h1 font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AppointFlow
          </span>
        </Link>
        <h2 className="mt-6 text-h2 font-bold text-slate-900 dark:text-slate-100">
          Sign in to your account
        </h2>
        <p className="mt-2 text-body-sm text-slate-500 dark:text-slate-400">
          Or{' '}
          <Link
            to="/get-started"
            className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            start a free business trial or register as a client
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftAddon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-label font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-caption font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftAddon={<Lock className="w-4 h-4" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign in
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="flex items-center gap-2 justify-center mb-3">
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              <span className="text-caption font-medium uppercase tracking-wider text-slate-400">
                Instant Testing
              </span>
              <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            </div>
            <button
              type="button"
              onClick={() => setIsDemoOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>🚀 Launch 1-Click Demo Accounts</span>
            </button>
          </div>
        </Card>
      </div>

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
