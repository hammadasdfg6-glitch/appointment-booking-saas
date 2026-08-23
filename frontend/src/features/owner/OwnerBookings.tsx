import { useState } from 'react';
import { Calendar, Clock, User as UserIcon, Filter, ChevronLeft, ChevronRight, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useBookings, useUpdateBookingStatus, useCancelBooking } from '../../hooks/useBookings';
import { useStaff } from '../../hooks/useStaff';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTableRow } from '../../components/ui/Skeleton';
import { formatCurrency, formatTime, formatDate } from '../../lib/utils';
import { Booking, BookingStatus } from '../../types/api';
import { getErrorMessage } from '../../api/client';
import { exportBookingsToCsv } from '../../lib/csv-utils';

export function OwnerBookings() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);

  const { data: staffList } = useStaff();
  const { data: bookingsData, isLoading } = useBookings({
    page,
    limit: 10,
    status: (statusFilter as BookingStatus) || undefined,
    date: dateFilter || undefined,
    staffId: staffFilter || undefined,
  });

  const updateStatusMutation = useUpdateBookingStatus();
  const cancelBookingMutation = useCancelBooking();

  const bookings = bookingsData?.bookings || [];
  const totalPages = bookingsData?.totalPages || 1;
  const totalBookingsCount = bookingsData?.total || bookings.length;

  const handleExportCsv = () => {
    if (bookings.length === 0) {
      toast.info('No bookings available to export.');
      return;
    }
    exportBookingsToCsv(bookings, `appointflow-bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${bookings.length} bookings to CSV`);
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await updateStatusMutation.mutateAsync({
        bookingId,
        status: newStatus,
      });
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      await cancelBookingMutation.mutateAsync(cancellingBooking._id);
      toast.success('Booking cancelled and slot released.');
      setCancellingBooking(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-slate-900 dark:text-slate-100">
            Organization Bookings
          </h1>
          <p className="text-body-sm text-slate-500 dark:text-slate-400 mt-1">
            Master view of all customer appointments, transactions, and scheduled service windows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCsv}
            disabled={bookings.length === 0 || isLoading}
            leftIcon={<Download className="w-4 h-4 text-slate-500" />}
            className="w-full sm:w-auto"
          >
            Export to CSV
          </Button>
        </div>
      </div>

      {/* Quick Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Bookings', value: '' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-body-sm font-medium transition-colors shrink-0 ${
              statusFilter === tab.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card padding="sm" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-caption font-medium text-slate-500 dark:text-slate-400 mb-1">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div>
            <label className="block text-caption font-medium text-slate-500 dark:text-slate-400 mb-1">
              Date Filter
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-caption font-medium text-slate-500 dark:text-slate-400 mb-1">
              Staff Filter
            </label>
            <Select
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Providers</option>
              {staffList?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full h-10"
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setStaffFilter('');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-caption font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Client</th>
                <th className="px-6 py-3.5">Service</th>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Price</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <>
                  <SkeletonTableRow columns={7} />
                  <SkeletonTableRow columns={7} />
                  <SkeletonTableRow columns={7} />
                </>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No bookings found matching the selected filters.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const customer =
                    typeof booking.customerId === 'object'
                      ? booking.customerId
                      : { name: 'Customer', email: '' };
                  const service =
                    typeof booking.serviceId === 'object'
                      ? booking.serviceId
                      : { name: 'Service', price: 0 };
                  const staff =
                    typeof booking.staffId === 'object'
                      ? booking.staffId
                      : { name: 'Staff Provider' };

                  return (
                    <tr
                      key={booking._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{customer.name}</div>
                        <div className="text-caption text-slate-400 font-normal">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {staff.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div>{formatDate(booking.date, 'MMM d, yyyy')}</div>
                        <div className="text-caption text-slate-400">
                          {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(booking.price)}
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancellingBooking(booking)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-caption text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        title="Cancel Organization Booking"
        description="Are you sure you want to cancel this booking? The slot will be unlocked and freed for other customers."
      >
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => setCancellingBooking(null)}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            isLoading={cancelBookingMutation.isPending}
            onClick={handleConfirmCancel}
          >
            Confirm Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
