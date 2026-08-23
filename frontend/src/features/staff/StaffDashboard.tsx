import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User as UserIcon, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useBookings, useUpdateBookingStatus, useCancelBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { formatTime, formatDate } from '../../lib/utils';
import { Booking, BookingStatus } from '../../types/api';
import { getErrorMessage } from '../../api/client';

export function StaffDashboard() {
  const { user } = useAuth();
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const { data: bookingsData, isLoading } = useBookings({ limit: 50 });
  const updateStatusMutation = useUpdateBookingStatus();
  const cancelBookingMutation = useCancelBooking();

  const bookings = bookingsData?.bookings || [];

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        bookingId,
        status: newStatus,
      });
      toast.success(`Booking status changed to ${newStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      await cancelBookingMutation.mutateAsync(cancellingBooking._id);
      toast.success('Appointment cancelled and slot released.');
      setCancellingBooking(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            My Schedule
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            View your assigned appointments and update customer booking statuses.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
          <Link to="/dashboard/staff/availability" className="w-full sm:w-auto inline-flex shrink-0">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Clock className="w-4 h-4 text-slate-500" />}
              className="w-full sm:w-auto"
            >
              Weekly Hours
            </Button>
          </Link>
          <Link to="/dashboard/staff/slots" className="w-full sm:w-auto inline-flex shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Calendar className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Generate Slots
            </Button>
          </Link>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description="You do not have any appointments assigned to you currently."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {bookings.map((booking) => {
            const customer =
              typeof booking.customerId === 'object'
                ? booking.customerId
                : { name: 'Customer', email: '' };
            const serviceName =
              typeof booking.serviceId === 'object' ? booking.serviceId?.name : 'Service';

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
                        <span>
                          {customer.name} ({customer.email})
                        </span>
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

                {/* Status Update & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-slate-500 dark:text-slate-400 font-medium">
                      Status:
                    </span>
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        handleStatusChange(booking._id, e.target.value as BookingStatus)
                      }
                      className="text-caption h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-800 dark:text-slate-200 focus-ring"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {booking.status !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                      onClick={() => setCancellingBooking(booking)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this booking? The slot will be unlocked and freed for other customers."
      >
        <div className="space-y-4">
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
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
