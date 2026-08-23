import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, User as UserIcon, Mail, Lock, Globe, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  registerOrgSchema,
  registerCustomerSchema,
  RegisterOrgFormData,
  RegisterCustomerFormData,
} from '../../lib/zod-schemas';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { getErrorMessage } from '../../api/client';

export function GetStartedPage() {
  const { registerOrg, registerCustomer } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'customer' || searchParams.get('org') ? 'customer' : 'owner';
  const orgParam = searchParams.get('org');

  const [activeTab, setActiveTab] = useState<'owner' | 'customer'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isLockedOrg, setIsLockedOrg] = useState(!!orgParam);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Owner Form
  const ownerForm = useForm<RegisterOrgFormData>({
    resolver: zodResolver(registerOrgSchema),
    defaultValues: {
      timezone: detectedTimezone,
      plan: 'free',
    },
  });

  // Auto-generate slug from business name
  const orgNameValue = ownerForm.watch('name');
  useEffect(() => {
    if (orgNameValue && !ownerForm.formState.dirtyFields.slug) {
      const suggestedSlug = orgNameValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      ownerForm.setValue('slug', suggestedSlug, { shouldValidate: true });
    }
  }, [orgNameValue, ownerForm]);

  // Customer Form
  const customerForm = useForm<RegisterCustomerFormData>({
    resolver: zodResolver(registerCustomerSchema),
    defaultValues: {
      orgName: searchParams.get('org') || '',
    },
  });

  const onOwnerSubmit = async (data: RegisterOrgFormData) => {
    setIsLoading(true);
    try {
      await registerOrg({
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        plan: data.plan,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        password: data.password, // Exact field name 'password' for org registration
      });
      toast.success('Organization registered successfully! Welcome to AppointFlow.');
      navigate('/dashboard/owner', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onCustomerSubmit = async (data: RegisterCustomerFormData) => {
    setIsLoading(true);
    try {
      const { role } = await registerCustomer({
        name: data.name,
        email: data.email,
        passwordHash: data.password, // Exact field name 'passwordHash' for customer registration
        orgName: data.orgName,
      });
      toast.success('Account created successfully!');
      navigate(`/dashboard/${role || 'customer'}`, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white font-bold shadow-sm">
            A
          </div>
          <span className="text-h1 font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AppointFlow
          </span>
        </Link>
        <h2 className="mt-4 text-h2 font-bold text-slate-900 dark:text-slate-100">
          Create your AppointFlow account
        </h2>
        <p className="mt-2 text-body-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <Card padding="lg">
          <Tabs
            className="mb-6"
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as 'owner' | 'customer')}
            tabs={[
              {
                id: 'owner',
                label: 'I run a business',
                icon: <Building2 className="w-4 h-4" />,
              },
              {
                id: 'customer',
                label: "I'm booking with a business",
                icon: <UserIcon className="w-4 h-4" />,
              },
            ]}
          />

          {/* Business Owner Registration */}
          {activeTab === 'owner' && (
            <form onSubmit={ownerForm.handleSubmit(onOwnerSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  placeholder="e.g. Apex Dental Clinic"
                  leftAddon={<Building2 className="w-4 h-4" />}
                  error={ownerForm.formState.errors.name?.message}
                  {...ownerForm.register('name')}
                />
                <Input
                  label="URL Slug"
                  placeholder="apex-dental"
                  helperText="Letters, numbers, and hyphens only"
                  leftAddon={<Globe className="w-4 h-4" />}
                  error={ownerForm.formState.errors.slug?.message}
                  {...ownerForm.register('slug')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Timezone"
                  placeholder="America/New_York"
                  helperText="Default slot timezone"
                  error={ownerForm.formState.errors.timezone?.message}
                  {...ownerForm.register('timezone')}
                />
                <Select
                  label="Plan Tier"
                  error={ownerForm.formState.errors.plan?.message}
                  {...ownerForm.register('plan')}
                >
                  <option value="free">Free ($0/mo)</option>
                  <option value="pro">Pro ($29/mo)</option>
                  <option value="enterprise">Enterprise ($99/mo)</option>
                </Select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-body-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Owner Account Credentials
                </h4>
                <div className="space-y-4">
                  <Input
                    label="Your Name"
                    placeholder="Jane Doe"
                    leftAddon={<UserIcon className="w-4 h-4" />}
                    error={ownerForm.formState.errors.ownerName?.message}
                    {...ownerForm.register('ownerName')}
                  />
                  <Input
                    label="Your Email"
                    type="email"
                    placeholder="jane@example.com"
                    leftAddon={<Mail className="w-4 h-4" />}
                    error={ownerForm.formState.errors.ownerEmail?.message}
                    {...ownerForm.register('ownerEmail')}
                  />
                  <Input
                    label="Password"
                    type={showOwnerPassword ? 'text' : 'password'}
                    placeholder="At least 4 characters"
                    leftAddon={<Lock className="w-4 h-4" />}
                    rightAddon={
                      <button
                        type="button"
                        onClick={() => setShowOwnerPassword((prev) => !prev)}
                        aria-label={showOwnerPassword ? 'Hide password' : 'Show password'}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                        tabIndex={-1}
                      >
                        {showOwnerPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    error={ownerForm.formState.errors.password?.message}
                    {...ownerForm.register('password')}
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Business & Account
                </Button>
              </div>
            </form>
          )}

          {/* Customer Self-Registration */}
          {activeTab === 'customer' && (
            <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
              <div>
                <Input
                  label="Business Name"
                  placeholder="e.g. Apex Dental Clinic"
                  helperText="Enter the exact name your service provider gave you"
                  leftAddon={<Building2 className="w-4 h-4" />}
                  readOnly={isLockedOrg}
                  error={customerForm.formState.errors.orgName?.message}
                  {...customerForm.register('orgName')}
                />
                {isLockedOrg && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLockedOrg(false);
                      customerForm.setValue('orgName', '');
                    }}
                    className="mt-1 text-caption text-brand-600 hover:text-brand-500 underline"
                  >
                    Not your business? Change name
                  </button>
                )}
              </div>

              <Input
                label="Your Full Name"
                placeholder="Alex Smith"
                leftAddon={<UserIcon className="w-4 h-4" />}
                error={customerForm.formState.errors.name?.message}
                {...customerForm.register('name')}
              />

              <Input
                label="Your Email"
                type="email"
                placeholder="alex@example.com"
                leftAddon={<Mail className="w-4 h-4" />}
                error={customerForm.formState.errors.email?.message}
                {...customerForm.register('email')}
              />

              <Input
                label="Password"
                type={showCustomerPassword ? 'text' : 'password'}
                placeholder="At least 4 characters"
                leftAddon={<Lock className="w-4 h-4" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowCustomerPassword((prev) => !prev)}
                    aria-label={showCustomerPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showCustomerPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={customerForm.formState.errors.password?.message}
                {...customerForm.register('password')}
              />

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Client Account
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
