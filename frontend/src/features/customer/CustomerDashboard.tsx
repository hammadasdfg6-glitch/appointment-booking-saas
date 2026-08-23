import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User as UserIcon, Plus, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useBookings, useCancelBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatTime, formatDate } from '../../lib/utils';
import { Booking } from '../../types/api';
import { getErrorMessage } from '../../api/client';

export function CustomerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const { data: bookingsData, isLoading } = useBookings({ limit: 50 });
  const cancelBookingMutation = useCancelBooking();

  const allBookings = bookingsData?.bookings || [];

  const now = new Date();
  const upcomingBookings = allBookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    const bookingDate = new Date(`${b.date}T${b.startAt || '00:00'}:00`);
    return bookingDate >= now;
  });

  const pastBookings = allBookings.filter((b) => {
    if (b.status === 'cancelled') return true;
    const bookingDate = new Date(`${b.date}T${b.startAt || '00:00'}:00`);
    return bookingDate < now;
  });

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      await cancelBookingMutation.mutateAsync(cancellingBooking._id);
      toast.success('Appointment cancelled successfully. Your slot has been released.');
      setCancellingBooking(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Welcome back, {user?.name}
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your scheduled appointments and discover new available slots.
          </p>
        </div>
        <Link to="/book" className="w-full sm:w-auto inline-flex shrink-0">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'upcoming' | 'past')}
        tabs={[
          {
            id: 'upcoming',
            label: 'Upcoming Appointments',
            count: upcomingBookings.length,
          },
          {
            id: 'past',
            label: 'Past & Cancelled',
            count: pastBookings.length,
          },
        ]}
      />

      {/* Bookings List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : currentBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          description={
            activeTab === 'upcoming'
              ? 'You have no scheduled appointments at this time. Book your first appointment today!'
              : 'You have not completed any appointments yet.'
          }
          actionLabel={activeTab === 'upcoming' ? 'Book an Appointment' : undefined}
          onAction={() => (window.location.href = '/book')}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {currentBookings.map((booking) => {
            const serviceName =
              typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service';
            const staffName =
              typeof booking.staffId === 'object' ? booking.staffId?.name : 'Staff Member';

            return (
              <Card key={booking._id} padding="md" className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-h3 font-semibold text-slate-900 dark:text-slate-100">
                        {serviceName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-body-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>With {staffName}</span>
                      </div>
                    </div>
                    <Badge variant={booking.status} className="capitalize shrink-0">
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-body-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{formatDate(booking.date, 'EEEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cancel Action (Upcoming only) */}
                {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                      onClick={() => setCancellingBooking(booking)}
                    >
                      Cancel Appointment
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Modal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this booking? This will release the reserved time slot and cannot be undone."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-950/40 text-danger-700 dark:text-danger-400 text-body-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>
              Once cancelled, you will need to re-book if you wish to reschedule.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setCancellingBooking(null)}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              isLoading={cancelBookingMutation.isPending}
              onClick={handleConfirmCancel}
            >
              Yes, Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
