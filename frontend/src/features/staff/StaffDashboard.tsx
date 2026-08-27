import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User as UserIcon, CheckCircle2, XCircle, AlertCircle, Sparkles, Check } from 'lucide-react';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { useBookings, useUpdateBookingStatus, useCancelBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { useTodayStaffStats, useWeeklyStaffStats, useMonthlyStaffStats } from '../../hooks/useStats';
import { StatCard } from '../../components/ui/StatCard';
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
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly'>('today');

  const { data: todayStats, isLoading: isLoadingToday } = useTodayStaffStats();
  const { data: weeklyStats, isLoading: isLoadingWeekly } = useWeeklyStaffStats();
  const { data: monthlyStats, isLoading: isLoadingMonthly } = useMonthlyStaffStats();

  const activeStats = timeframe === 'today' ? todayStats : timeframe === 'weekly' ? weeklyStats : monthlyStats;
  const isLoadingStats = timeframe === 'today' ? isLoadingToday : timeframe === 'weekly' ? isLoadingWeekly : isLoadingMonthly;

  const { data: bookingsData, isLoading } = useBookings({ limit: 50 });
  const updateStatusMutation = useUpdateBookingStatus();
  const cancelBookingMutation = useCancelBooking();

  const bookings = bookingsData?.bookings || [];
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Current Calendar Week (Sunday to Today)
  const startOfWeekStr = format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd');

  // Current Calendar Month (1st of Month to Today)
  const startOfMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');

  const filteredBookings = bookings.filter((b) => {
    if (timeframe === 'today') {
      return b.date === todayStr;
    }
    if (timeframe === 'weekly') {
      return b.date >= startOfWeekStr && b.date <= todayStr;
    }
    if (timeframe === 'monthly') {
      return b.date >= startOfMonthStr && b.date <= todayStr;
    }
    return true;
  });

  const todayBookings = bookings.filter((b) => b.date === todayStr && b.status !== 'cancelled');


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
            View your assigned appointments, real-time analytics, and update statuses.
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

      {/* Staff Analytics Overview */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-h3 font-semibold text-slate-900 dark:text-slate-100">
            Performance Overview
          </h2>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1 text-caption font-medium rounded-md transition-all ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 text-caption font-medium rounded-md transition-all ${
                timeframe === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1 text-caption font-medium rounded-md transition-all ${
                timeframe === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={timeframe === 'today' ? "Today's Bookings" : timeframe === 'weekly' ? 'Weekly Bookings' : 'Monthly Bookings'}
              value={activeStats?.totalBookings ?? 0}
              icon={Calendar}
            />
            <StatCard
              label="Completed"
              value={activeStats?.completedBookings ?? 0}
              icon={CheckCircle2}
              className="border-emerald-100 dark:border-emerald-950/40"
            />
            <StatCard
              label="Pending / Upcoming"
              value={activeStats?.pendingBookings ?? 0}
              icon={Clock}
              className="border-amber-100 dark:border-amber-950/40"
            />
            <StatCard
              label="Cancelled"
              value={activeStats?.cancelledBookings ?? 0}
              icon={XCircle}
              className="border-rose-100 dark:border-rose-950/40"
            />
          </div>
        )}
      </div>

      {/* Today's Agenda Banner */}
      {todayBookings.length > 0 && (
        <Card padding="md" className="border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-h3 font-semibold text-slate-900 dark:text-slate-100">
                Today's Agenda ({todayBookings.length} {todayBookings.length === 1 ? 'appointment' : 'appointments'})
              </h2>
            </div>
            <span className="text-caption font-medium text-slate-500">
              {formatDate(todayStr, 'MMMM d, yyyy')}
            </span>
          </div>

          <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {todayBookings.map((b) => {
              const customer = typeof b.customerId === 'object' ? b.customerId : { name: 'Customer', email: '' };
              const serviceName = typeof b.serviceId === 'object' ? b.serviceId?.name : 'Service';
              return (
                <div key={b._id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatTime(b.startAt)} - {formatTime(b.endAt)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-body-sm text-slate-700 dark:text-slate-300 font-medium">
                        {serviceName}
                      </span>
                      <Badge variant={b.status} className="capitalize text-caption">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-caption text-slate-500 dark:text-slate-400 mt-0.5">
                      Client: {customer.name} ({customer.email})
                    </p>
                  </div>

                  {b.status !== 'completed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange(b._id, 'completed')}
                      leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
                      className="shrink-0"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Bookings Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-h3 font-semibold text-slate-900 dark:text-slate-100">
          {timeframe === 'today' ? "Today's Appointments" : timeframe === 'weekly' ? "This Week's Appointments" : "This Month's Appointments"}
        </h2>
        <span className="text-caption text-slate-500 font-medium">
          Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'appointment' : 'appointments'}
        </span>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No appointments for ${timeframe === 'today' ? 'today' : timeframe === 'weekly' ? 'this week' : 'this month'}`}
          description={`You do not have any appointments assigned to you for ${timeframe === 'today' ? 'today' : timeframe === 'weekly' ? 'the past 7 days' : 'the past 30 days'}.`}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => {
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
