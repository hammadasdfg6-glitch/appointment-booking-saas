import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, User as UserIcon, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { checkoutApi } from '../api/checkout.api';
import { Booking, Service, User, SlotItem } from '../types/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatTime, formatDate } from '../lib/utils';
import { getErrorMessage } from '../api/client';

export function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(null);

  // Free appointment state passed via location
  const stateData = location.state as {
    service?: Service;
    staff?: User;
    date?: string;
    slot?: SlotItem;
  } | null;

  const confirmPayment = async (sid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await checkoutApi.confirmCheckout(sid);
      if (response.booking) {
        setBooking(response.booking);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      confirmPayment(sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <Card padding="lg">
          {isLoading ? (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-spin mx-auto" />
              <h2 className="text-h2 font-semibold text-slate-900 dark:text-slate-100">
                Confirming your payment...
              </h2>
              <p className="text-body-sm text-slate-500 dark:text-slate-400">
                Please wait a moment while we verify your transaction and reserve your appointment.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="text-h2 font-semibold text-slate-900 dark:text-slate-100">
                Verifying confirmation
              </h2>
              <p className="text-body-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your payment may still be processing. You can retry confirmation or check your bookings list.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {sessionId && (
                  <Button
                    variant="primary"
                    onClick={() => confirmPayment(sessionId)}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                  >
                    Retry Verification
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard/customer')}
                >
                  View My Bookings
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-h2 font-bold text-slate-900 dark:text-slate-100">
                  Appointment Confirmed!
                </h1>
                <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
                  A confirmation notification has been dispatched to your email.
                </p>
              </div>

              {/* Booking Summary Box */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                    {booking?.serviceId
                      ? typeof booking.serviceId === 'object'
                        ? booking.serviceId.name
                        : 'Scheduled Service'
                      : stateData?.service?.name || 'Appointment'}
                  </span>
                  <Badge variant="confirmed">Confirmed</Badge>
                </div>

                <div className="text-body-sm text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {booking?.date
                        ? formatDate(booking.date, 'EEEE, MMMM d, yyyy')
                        : stateData?.date
                        ? formatDate(stateData.date, 'EEEE, MMMM d, yyyy')
                        : 'Scheduled Date'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {booking?.startAt
                        ? formatTime(booking.startAt)
                        : stateData?.slot?.startTime
                        ? formatTime(stateData.slot.startTime)
                        : 'Scheduled Time'}
                    </span>
                  </div>

                  {(booking?.staffId || stateData?.staff) && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>
                        {booking?.staffId
                          ? typeof booking.staffId === 'object'
                            ? booking.staffId.name
                            : 'Staff Provider'
                          : stateData?.staff?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link to="/dashboard/customer">
                  <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View My Bookings
                  </Button>
                </Link>
                <Link to="/book">
                  <Button variant="secondary" className="w-full">
                    Book Another Appointment
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
