import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  X,
  Clock,
  Calendar as CalendarIcon,
  User as UserIcon,
  CreditCard,
  ShieldCheck,
  Search,
  Sun,
  Sunset,
  Sunrise,
  Timer,
  AlertCircle,
  Lock,
  LogIn,
  UserPlus,
  UserCheck,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { format, addDays, isBefore, startOfToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { useAuth } from '../../hooks/useAuth';

import { useServices } from '../../hooks/useServices';
import { useStaff } from '../../hooks/useStaff';
import { useSlots } from '../../hooks/useSlots';
import { useCreateBooking } from '../../hooks/useBookings';
import { checkoutApi } from '../../api/checkout.api';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatTime, formatDate } from '../../lib/utils';
import { Service, User, SlotItem } from '../../types/api';
import { getErrorMessage } from '../../api/client';

const STEPS = [
  { id: 1, label: 'Service' },
  { id: 2, label: 'Provider' },
  { id: 3, label: 'Date' },
  { id: 4, label: 'Time' },
  { id: 5, label: 'Review' },
];

export function BookingWizardPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Selected State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Step 1 Search & Filter State
  const [serviceSearch, setServiceSearch] = useState('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'quick' | 'standard' | 'long'>('all');

  // Step 4 Time-of-Day Tab State
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Step 5 2-Minute Hold Timer State (120 seconds)
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(120);

  // Auth & Org Param Hook
  const { user, isAuthenticated, role, login, registerCustomer, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');

  // Customer Auth state on Step 5
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Queries
  const { data: servicesData, isLoading: isLoadingServices } = useServices(1, 100);
  const { data: staffList, isLoading: isLoadingStaff } = useStaff();
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots(
    selectedStaff?._id,
    selectedDate
  );

  const createBookingMutation = useCreateBooking();

  // 2-minute countdown timer on Step 5
  useEffect(() => {
    if (currentStep !== 5) {
      setHoldSecondsLeft(120);
      return;
    }

    const interval = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.warning('Hold time expired. Please re-select your slot.');
          setCurrentStep(4);
          setSelectedSlot(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Filter staff to role === 'staff' only (per Section 6 requirement)
  const staffOnly = (staffList || []).filter((s) => s.role === 'staff');

  const activeServices = (servicesData?.services || []).filter((s) => s.active !== false);

  // Filter services by search text and duration filter
  const filteredServices = activeServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(serviceSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (durationFilter === 'quick') return service.durationMinutes <= 30;
    if (durationFilter === 'standard') return service.durationMinutes > 30 && service.durationMinutes <= 60;
    if (durationFilter === 'long') return service.durationMinutes > 60;
    return true;
  });

  // Slot Bucketing Helper
  const allSlots = slotsData?.slots || [];
  const morningSlots = allSlots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour < 12;
  });
  const afternoonSlots = allSlots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour >= 12 && hour < 17;
  });
  const eveningSlots = allSlots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour >= 17;
  });

  const displayedSlots =
    timeOfDayFilter === 'morning'
      ? morningSlots
      : timeOfDayFilter === 'afternoon'
      ? afternoonSlots
      : timeOfDayFilter === 'evening'
      ? eveningSlots
      : allSlots;

  // Handlers
  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleSelectStaff = (staff: User) => {
    setSelectedStaff(staff);
    setCurrentStep(3);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setCurrentStep(4);
  };

  const handleSelectSlot = (slot: SlotItem) => {
    setSelectedSlot(slot);
    setCurrentStep(5);
  };

  const handleCustomerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error('Please enter your email and password.');
      return false;
    }
    setIsSubmittingAuth(true);
    try {
      await login({
        email: authEmail,
        passwordHash: authPassword,
      });
      toast.success('Signed in successfully as customer!');
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleCustomerRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      toast.error('Please fill in all registration fields.');
      return false;
    }
    if (authPassword.length < 4) {
      toast.error('Password must be at least 4 characters.');
      return false;
    }
    setIsSubmittingAuth(true);
    try {
      const targetOrg = orgParam || selectedStaff?.orgId || user?.orgId || 'org';
      await registerCustomer({
        name: authName,
        email: authEmail,
        passwordHash: authPassword,
        orgName: targetOrg,
      });
      toast.success('Customer account created and signed in!');
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleExitOrCancel = () => {
    if (role === 'customer') {
      navigate('/dashboard/customer');
    } else if (role === 'staff') {
      navigate('/dashboard/staff');
    } else if (role === 'owner') {
      navigate('/dashboard/owner');
    } else {
      navigate('/');
    }
  };

  const handleConfirmOrPay = async () => {
    if (!selectedService?._id || !selectedStaff?._id || !selectedSlot || !selectedDate) {
      toast.error('Please complete all selection steps.');
      return;
    }

    // Customer Auth Check
    if (!isAuthenticated || role !== 'customer') {
      toast.warning('Please sign into or create your customer account below to continue.');
      return;
    }

    // Branch 1: Free Service ($0) -> POST /booking directly
    if (selectedService.price === 0) {
      setIsProcessingPayment(true);
      try {
        await createBookingMutation.mutateAsync({
          serviceId: selectedService._id,
          staffId: selectedStaff._id,
          startAt: selectedSlot.startTime, // Exact startTime string
          date: selectedDate,
        });
        toast.success('Your booking is confirmed!');
        navigate('/booking-success?free=true', {
          state: {
            service: selectedService,
            staff: selectedStaff,
            date: selectedDate,
            slot: selectedSlot,
          },
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // Branch 2: Paid Service -> POST /checkout/session -> Stripe redirect
    setIsProcessingPayment(true);
    try {
      const response = await checkoutApi.createCheckoutSession({
        serviceId: selectedService._id,
        staffId: selectedStaff._id,
        slotId: selectedSlot._id,
        startAt: selectedSlot.startTime,
        date: selectedDate,
      });

      if (response.url) {
        toast.info('Redirecting to secure Stripe Checkout...');
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsProcessingPayment(false);
    }
  };

  // Calendar dates generator (Today -> +60 days)
  const today = startOfToday();
  const availableDates: Date[] = [];
  for (let i = 0; i <= 60; i++) {
    availableDates.push(addDays(today, i));
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-between">
      {/* Wizard Header Bar */}
      <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 dark:bg-brand-500 text-white font-bold flex items-center justify-center">
            A
          </div>
          <span className="text-h3 font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:block">
            AppointFlow
          </span>
        </Link>

        {/* Stepper Center */}
        <div className="w-full max-w-md mx-4">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(step) => {
              if (step < currentStep) setCurrentStep(step);
            }}
          />
        </div>

        {/* Close Wizard */}
        <button
          onClick={handleExitOrCancel}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Exit booking wizard"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Wizard Step Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12">
        {/* STEP 1: CHOOSE SERVICE */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
                Select a Service
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose the appointment type or service you'd like to book.
              </p>
            </div>

            {/* Service Search and Filter Toolbar */}
            {activeServices.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex-1 max-w-sm">
                  <Input
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    leftAddon={<Search className="w-4 h-4 text-slate-400" />}
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setDurationFilter('all')}
                    className={`px-3 py-1.5 text-caption font-medium rounded-lg transition-colors shrink-0 ${
                      durationFilter === 'all'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    All Durations
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationFilter('quick')}
                    className={`px-3 py-1.5 text-caption font-medium rounded-lg transition-colors shrink-0 ${
                      durationFilter === 'quick'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    ≤ 30 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationFilter('standard')}
                    className={`px-3 py-1.5 text-caption font-medium rounded-lg transition-colors shrink-0 ${
                      durationFilter === 'standard'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    30-60 min
                  </button>
                </div>
              </div>
            )}

            {isLoadingServices ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeServices.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No services available"
                description="This business has not published any bookable services yet."
                actionLabel="Back to Dashboard"
                onAction={() => navigate('/dashboard/customer')}
              />
            ) : filteredServices.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching services found"
                description="Try clearing your search query or adjusting duration filters."
                actionLabel="Clear Filters"
                onAction={() => {
                  setServiceSearch('');
                  setDurationFilter('all');
                }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredServices.map((service) => {
                  const isSelected = selectedService?._id === service._id;
                  return (
                    <button
                      key={service._id}
                      onClick={() => handleSelectService(service)}
                      className={`text-left p-5 rounded-xl border transition-all text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus-ring ${
                        isSelected
                          ? 'border-brand-600 ring-2 ring-brand-500 shadow-sm dark:border-brand-500'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-h3 font-semibold">{service.name}</h3>
                        <span className="text-body-sm font-bold text-brand-600 dark:text-brand-400 shrink-0">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-1.5 text-caption text-slate-500 dark:text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.durationMinutes} minutes</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CHOOSE PROVIDER */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
                Choose a Provider
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                Select a team member for your {selectedService?.name}.
              </p>
            </div>

            {isLoadingStaff ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : staffOnly.length === 0 ? (
              <EmptyState
                icon={UserIcon}
                title="No staff members available"
                description="There are currently no staff members configured for bookings in this organization."
                actionLabel="Back to Services"
                onAction={() => setCurrentStep(1)}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {staffOnly.map((staff) => {
                  const isSelected = selectedStaff?._id === staff._id;
                  return (
                    <button
                      key={staff._id}
                      onClick={() => handleSelectStaff(staff)}
                      className={`text-left p-5 rounded-xl border transition-all flex items-center gap-4 bg-white dark:bg-slate-900 focus-ring ${
                        isSelected
                          ? 'border-brand-600 ring-2 ring-brand-500 shadow-sm dark:border-brand-500'
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-h3 flex items-center justify-center shrink-0">
                        {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {staff.name}
                        </h3>
                        <p className="text-body-sm text-slate-500 dark:text-slate-400 truncate">
                          {staff.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CHOOSE DATE */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
                Pick a Date
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                Appointments can be booked up to 60 days in advance with {selectedStaff?.name}.
              </p>
            </div>

            <Card padding="md">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto p-1">
                {availableDates.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;
                  const dayName = format(date, 'EEE');
                  const monthDay = format(date, 'MMM d');

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleSelectDate(dateStr)}
                      className={`p-3 rounded-lg border text-center transition-all focus-ring ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:border-brand-500 dark:text-brand-300 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="block text-caption uppercase text-slate-400 dark:text-slate-500 font-medium">
                        {dayName}
                      </span>
                      <span className="block text-body font-semibold mt-0.5">{monthDay}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 4: CHOOSE TIME SLOT */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
                Select a Time
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                Available slots for {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')} with {selectedStaff?.name}.
              </p>
            </div>

            {/* Time-of-Day Filter Tabs */}
            {allSlots.length > 0 && (
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setTimeOfDayFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-colors ${
                    timeOfDayFilter === 'all'
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  All Times ({allSlots.length})
                </button>
                {morningSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTimeOfDayFilter('morning')}
                    className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-colors flex items-center gap-1.5 ${
                      timeOfDayFilter === 'morning'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sunrise className="w-3.5 h-3.5" />
                    Morning ({morningSlots.length})
                  </button>
                )}
                {afternoonSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTimeOfDayFilter('afternoon')}
                    className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-colors flex items-center gap-1.5 ${
                      timeOfDayFilter === 'afternoon'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Afternoon ({afternoonSlots.length})
                  </button>
                )}
                {eveningSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTimeOfDayFilter('evening')}
                    className={`px-3 py-1.5 rounded-lg text-caption font-medium transition-colors flex items-center gap-1.5 ${
                      timeOfDayFilter === 'evening'
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sunset className="w-3.5 h-3.5" />
                    Evening ({eveningSlots.length})
                  </button>
                )}
              </div>
            )}

            {isLoadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !slotsData?.slots || slotsData.slots.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No times available on this date"
                description="All slots for this day are either booked or outside the provider's working hours. Please choose another date."
                actionLabel="Choose Another Date"
                onAction={() => setCurrentStep(3)}
              />
            ) : displayedSlots.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No slots in this time period"
                description="Try switching to another time-of-day category."
                actionLabel="Show All Times"
                onAction={() => setTimeOfDayFilter('all')}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {displayedSlots.map((slot) => {
                  const isSelected = selectedSlot?._id === slot._id;
                  return (
                    <button
                      key={slot._id}
                      onClick={() => handleSelectSlot(slot)}
                      className={`h-11 px-4 rounded-lg border text-body-sm font-medium transition-all flex items-center justify-center gap-2 focus-ring ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 text-white font-semibold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-brand-500 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(slot.startTime)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRM */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
                Review Appointment Details
              </h1>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                Please double-check your appointment information before continuing.
              </p>
            </div>

            {/* 2-Minute Hold Timer Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
              holdSecondsLeft > 45
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : holdSecondsLeft > 15
                ? 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                : 'bg-danger-50/80 border-danger-200 text-danger-900 dark:bg-danger-950/40 dark:border-danger-800 dark:text-danger-300 animate-pulse'
            }`}>
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-body-sm font-semibold block">
                    Slot Reserved Under Hold
                  </span>
                  <span className="text-caption opacity-80">
                    Complete your reservation before the hold lock expires.
                  </span>
                </div>
              </div>
              <div className="font-mono text-h3 font-bold shrink-0">
                {String(Math.floor(holdSecondsLeft / 60)).padStart(2, '0')}:
                {String(holdSecondsLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <Card padding="lg">
              <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800">
                {/* Service */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-caption text-slate-500 dark:text-slate-400 uppercase font-medium">
                      Service
                    </span>
                    <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedService?.name}
                    </h3>
                    <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedService?.durationMinutes} minutes duration
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-body-sm font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Change
                  </button>
                </div>

                {/* Provider */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-caption text-slate-500 dark:text-slate-400 uppercase font-medium">
                      Provider
                    </span>
                    <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedStaff?.name}
                    </h3>
                    <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedStaff?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-body-sm font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Change
                  </button>
                </div>

                {/* Date & Time */}
                <div className="pt-4 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-caption text-slate-500 dark:text-slate-400 uppercase font-medium">
                      Date & Time
                    </span>
                    <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedDate && formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedSlot && formatTime(selectedSlot.startTime)} - {selectedSlot && formatTime(selectedSlot.endTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-body-sm font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Change
                  </button>
                </div>

                {/* Total Price */}
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-body font-semibold text-slate-900 dark:text-slate-100">
                    Total Amount Due
                  </span>
                  <span className="text-h2 font-bold text-brand-600 dark:text-brand-400">
                    {selectedService ? formatCurrency(selectedService.price) : '$0.00'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Customer Account Authentication Requirement Card */}
            {isAuthenticated && role === 'customer' ? (
              <Card padding="md" className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                          {user?.name}
                        </span>
                        <Badge variant="customer">Customer Account</Badge>
                      </div>
                      <span className="text-caption text-slate-500 dark:text-slate-400">
                        {user?.email} • Ready for instant appointment confirmation
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-caption text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    Switch Account
                  </button>
                </div>
              </Card>
            ) : isAuthenticated && role !== 'customer' ? (
              <Card padding="md" className="border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                        Staff / Owner Session Detected ({user?.name})
                      </h4>
                      <p className="text-caption text-slate-600 dark:text-slate-400 mt-0.5">
                        To maintain separated booking records, appointments must be reserved under a customer account. Please sign in with or register your customer account below:
                      </p>
                    </div>
                  </div>

                  {/* Inline Customer Auth for Staff/Owner */}
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-900/50 space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthTab('signin')}
                        className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                          authTab === 'signin'
                            ? 'bg-brand-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Sign In as Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab('register')}
                        className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                          authTab === 'register'
                            ? 'bg-brand-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        Create Customer Account
                      </button>
                    </div>

                    {authTab === 'signin' ? (
                      <form onSubmit={handleCustomerLogin} className="space-y-3">
                        <Input
                          label="Customer Email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                        />
                        <Input
                          label="Password"
                          type={showAuthPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          rightAddon={
                            <button
                              type="button"
                              onClick={() => setShowAuthPassword(!showAuthPassword)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                          required
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full"
                          isLoading={isSubmittingAuth}
                          leftIcon={<LogIn className="w-4 h-4" />}
                        >
                          Sign In & Proceed
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleCustomerRegister} className="space-y-3">
                        <Input
                          label="Your Full Name"
                          placeholder="Jane Doe"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          required
                        />
                        <Input
                          label="Your Email"
                          type="email"
                          placeholder="jane.doe@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                        />
                        <Input
                          label="Password"
                          type={showAuthPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          rightAddon={
                            <button
                              type="button"
                              onClick={() => setShowAuthPassword(!showAuthPassword)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                          required
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full"
                          isLoading={isSubmittingAuth}
                          leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                          Create Customer Account & Proceed
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              /* Unauthenticated Visitor: Compulsory Customer Auth Card */
              <Card padding="lg" className="border-brand-500/30 shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-h3 font-bold text-slate-900 dark:text-slate-100">
                        Account Required to Confirm
                      </h3>
                      <p className="text-body-sm text-slate-500 dark:text-slate-400">
                        Sign into or create your customer account to lock in your appointment.
                      </p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1">
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`flex-1 py-2 text-body-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        authTab === 'register'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      Create New Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('signin')}
                      className={`flex-1 py-2 text-body-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        authTab === 'signin'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In to Account
                    </button>
                  </div>

                  {authTab === 'register' ? (
                    <form onSubmit={handleCustomerRegister} className="space-y-4 pt-1">
                      <Input
                        label="Your Full Name"
                        placeholder="Jane Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                      />
                      <Input
                        label="Your Email"
                        type="email"
                        placeholder="jane.doe@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                      />
                      <Input
                        label="Password"
                        type={showAuthPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        helperText="Minimum 4 characters"
                        rightAddon={
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                        required
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmittingAuth}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                      >
                        Create Account & Proceed
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleCustomerLogin} className="space-y-4 pt-1">
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="your.email@example.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                      />
                      <Input
                        label="Password"
                        type={showAuthPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        rightAddon={
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                        required
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmittingAuth}
                        leftIcon={<LogIn className="w-4 h-4" />}
                      >
                        Sign In & Proceed
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center gap-3 text-body-sm text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                {selectedService?.price === 0
                  ? 'This service is complimentary. No payment required.'
                  : 'Slot is held for 2 minutes. Payments are processed securely via Stripe.'}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Wizard Action Bar */}
      <footer className="h-20 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            if (currentStep > 1) setCurrentStep(currentStep - 1);
            else handleExitOrCancel();
          }}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        <div>
          {currentStep === 5 ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleConfirmOrPay}
              isLoading={isProcessingPayment}
              disabled={isProcessingPayment || !isAuthenticated || role !== 'customer'}
              leftIcon={selectedService?.price === 0 ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            >
              {!isAuthenticated || role !== 'customer'
                ? 'Sign In Above to Confirm'
                : selectedService?.price === 0
                ? 'Confirm Booking'
                : `Continue to Payment (${formatCurrency(selectedService?.price || 0)})`}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              disabled={
                (currentStep === 1 && !selectedService) ||
                (currentStep === 2 && !selectedStaff) ||
                (currentStep === 3 && !selectedDate) ||
                (currentStep === 4 && !selectedSlot)
              }
              onClick={() => setCurrentStep(currentStep + 1)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
