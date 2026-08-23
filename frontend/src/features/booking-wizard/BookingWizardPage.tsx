import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, X, Clock, Calendar as CalendarIcon, User as UserIcon, CreditCard, ShieldCheck } from 'lucide-react';
import { format, addDays, isBefore, startOfToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { useServices } from '../../hooks/useServices';
import { useStaff } from '../../hooks/useStaff';
import { useSlots } from '../../hooks/useSlots';
import { useCreateBooking } from '../../hooks/useBookings';
import { checkoutApi } from '../../api/checkout.api';

import { Button } from '../../components/ui/Button';
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

  // Queries
  const { data: servicesData, isLoading: isLoadingServices } = useServices(1, 100);
  const { data: staffList, isLoading: isLoadingStaff } = useStaff();
  const { data: slotsData, isLoading: isLoadingSlots } = useSlots(
    selectedStaff?._id,
    selectedDate
  );

  const createBookingMutation = useCreateBooking();

  // Filter staff to role === 'staff' only (per Section 6 requirement)
  const staffOnly = (staffList || []).filter((s) => s.role === 'staff');

  const activeServices = (servicesData?.services || []).filter((s) => s.active !== false);

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

  const handleConfirmOrPay = async () => {
    if (!selectedService?._id || !selectedStaff?._id || !selectedSlot || !selectedDate) {
      toast.error('Please complete all selection steps.');
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
          onClick={() => navigate('/dashboard/customer')}
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
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {activeServices.map((service) => {
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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slotsData.slots.map((slot) => {
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
            else navigate('/dashboard/customer');
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
              disabled={isProcessingPayment}
              leftIcon={selectedService?.price === 0 ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            >
              {selectedService?.price === 0 ? 'Confirm Booking' : 'Continue to Payment'}
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
