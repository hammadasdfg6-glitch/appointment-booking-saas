import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, User, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../api/client';

export interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DemoAccount {
  id: 'admin' | 'staff' | 'customer';
  role: 'owner' | 'staff' | 'customer';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: typeof ShieldCheck;
  iconColor: string;
  iconBg: string;
  email: string;
  password: string;
  targetDashboard: string;
  features: string[];
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    role: 'owner',
    title: 'Business Owner / Admin',
    subtitle: 'Full enterprise control & master analytics',
    badge: 'Owner Access',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    icon: ShieldCheck,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80',
    email: 'demo.owner@appointflow.com',
    password: 'Password123!',
    targetDashboard: '/dashboard/owner',
    features: [
      'Real-time revenue & booking performance analytics',
      'Full service catalog CRUD & pricing control',
      'Staff onboarding and team provisioning',
      'Master bookings ledger with status tracking & CSV export',
    ],
  },
  {
    id: 'staff',
    role: 'staff',
    title: 'Staff Service Provider',
    subtitle: 'Personal schedule & slot management',
    badge: 'Staff Access',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    icon: UserCheck,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/80',
    email: 'demo.staff@appointflow.com',
    password: 'Password123!',
    targetDashboard: '/dashboard/staff',
    features: [
      "Today's Agenda priority card with 1-click status completion",
      'Performance Overview (Today, This Week, This Month)',
      'Weekly working hours & recurring availability rules',
      'Automated batch slot generator matrix',
    ],
  },
  {
    id: 'customer',
    role: 'customer',
    title: 'Client / Customer',
    subtitle: 'Seamless appointment booking experience',
    badge: 'Customer Access',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    icon: User,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80',
    email: 'demo.customer@appointflow.com',
    password: 'Password123!',
    targetDashboard: '/dashboard/customer',
    features: [
      '5-step progressive booking wizard with real-time slot selection',
      'Stripe hosted checkout & 2-minute atomic slot reservation hold',
      'Personal appointment history with active & past tracking',
      '1-click Google Calendar & Apple/Outlook (.ics) sync',
    ],
  },
];

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  const handleSelectDemo = async (account: DemoAccount) => {
    setLoggingInRole(account.id);
    try {
      await login({
        email: account.email,
        passwordHash: account.password,
      });

      toast.success(`Logged in as Demo ${account.title}!`, {
        description: 'Explore all live features with this pre-configured test account.',
      });

      onClose();
      navigate(account.targetDashboard, { replace: true });
    } catch (err) {
      toast.error('Failed to log into demo account', {
        description: getErrorMessage(err),
      });
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🚀 Explore AppointFlow Live Demo"
      description="Choose a pre-configured role to immediately test all features as a real user."
      maxWidth="xl"
    >
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isLoggingIn = loggingInRole === account.id;
            const isAnyLoggingIn = loggingInRole !== null;

            return (
              <div
                key={account.id}
                onClick={() => !isAnyLoggingIn && handleSelectDemo(account)}
                className={`group relative flex flex-col justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer select-none text-left ${
                  isLoggingIn
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 bg-white dark:bg-slate-900/90 hover:shadow-lg dark:hover:shadow-brand-950/30 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${account.iconBg}`}
                    >
                      <Icon className={`w-5 h-5 ${account.iconColor}`} />
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${account.badgeColor}`}
                    >
                      {account.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {account.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                    {account.subtitle}
                  </p>

                  {/* Feature Bullets */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mb-5">
                    {account.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  disabled={isAnyLoggingIn}
                  className={`w-full py-2.5 px-3.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                    isLoggingIn
                      ? 'bg-brand-600 text-white cursor-wait'
                      : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-600 text-slate-800 dark:text-slate-200 group-hover:text-white'
                  }`}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch {account.title.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
          <span>
            Demo accounts are pre-seeded with appointments, availability schedules, and services so you can test immediately.
          </span>
        </div>
      </div>
    </Modal>
  );
}
