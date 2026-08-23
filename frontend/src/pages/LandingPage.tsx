import { Link } from 'react-router-dom';
import { Calendar, Shield, CreditCard, Sparkles, CheckCircle2, ArrowRight, Clock, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white font-bold shadow-sm">
              A
            </div>
            <span className="text-h2 font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AppointFlow
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={`/dashboard/${role}`}>
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="inline-flex">
                <Button variant="ghost" size="md">Log in</Button>
              </Link>
              <Link to="/get-started" className="inline-flex">
                <Button variant="primary" size="md">Get Started</Button>
              </Link>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50/80 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-label font-medium mb-6 animate-in fade-in">
              <Sparkles className="w-4 h-4" />
              <span>The Next-Gen SaaS Booking Infrastructure</span>
            </div>

            <h1 className="text-display sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Effortless scheduling for modern service businesses
            </h1>

            <p className="mt-6 text-body sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              AppointFlow gives salons, clinics, tutors, and consultants a complete appointment engine with real-time slot generation, multi-tenant staff management, and automated Stripe payments.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/get-started?tab=owner" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start your business
                </Button>
              </Link>
              <Link to="/get-started?tab=customer" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  I have an appointment to book
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-body-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Zero double-booking guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Hosted Stripe checkout</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">99.99%</div>
                <div className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">Uptime SLA</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">2 min</div>
                <div className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">Redis Slot Hold</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">100%</div>
                <div className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">Isolated Tenancy</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">0 ms</div>
                <div className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">Double Booking Risk</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Features Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
              Engineered for precision and scale
            </h2>
            <p className="text-body text-slate-500 dark:text-slate-400 mt-3">
              Everything your team needs to accept payments, coordinate staff working windows, and deliver flawless booking experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-h2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Multi-Tenant Architecture
              </h3>
              <p className="text-body text-slate-500 dark:text-slate-400 leading-relaxed">
                Organizations operate in complete isolation. Customers sign into their specific business with granular role-based permissions for owners and staff.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-h2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Real-Time Slots & Holds
              </h3>
              <p className="text-body text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatic nightly slot generation paired with atomic 2-minute Redis hold locks during checkout prevents duplicate bookings under heavy load.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-h2 font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Integrated Stripe Checkout
              </h3>
              <p className="text-body text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamless credit card processing for paid services and instant zero-friction confirmations for free consultations.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">AppointFlow</span>
            <span>&copy; {new Date().getFullYear()} AppointFlow SaaS. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/get-started" className="hover:text-slate-900 dark:hover:text-slate-200">
              Get Started
            </Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-200">
              Log In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
